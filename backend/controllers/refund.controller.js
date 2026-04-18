const mongoose = require("mongoose");
const Refund = require("../models/refund.model");
const Transaction = require("../models/transaction.model");
const Product = require("../models/product.model");
const Branch = require("../models/branch.model");

// Create a refund
const createRefund = async (req, res) => {
  try {
   
    const { invoiceId, type, reason, items } = req.body;
    const { _id: userId, role, branch_id, name: userName } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    // Validate required fields
    if (!invoiceId || !reason || !items || items.length === 0) {
      return res.status(400).json({ 
        message: "Invoice ID, reason, and items are required" 
      });
    }

    // Find the original transaction
    const transaction = await Transaction.findById(invoiceId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if transaction can be refunded
    if (transaction.is_void) {
      return res.status(400).json({ message: "Cannot refund a voided transaction" });
    }
    
    if (transaction.status === 'refunded') {
      return res.status(400).json({ message: "Transaction is already fully refunded" });
    }

    // Determine branch for refund
    const refundBranchId = isAdmin ? transaction.branchId : branch_id;

    // Check branch access
    if (!isAdmin && branch_id && String(transaction.branchId) !== String(branch_id)) {
      return res.status(403).json({ message: "Access denied - wrong branch" });
    }

    // Calculate total refunded amount so far from existing refunds
    const existingRefunds = await Refund.find({ invoiceId });
    const totalPreviouslyRefunded = existingRefunds.reduce((sum, refund) => sum + refund.total, 0);
    
    // Check if trying to refund more than available
    const maxRefundable = transaction.total - totalPreviouslyRefunded;
    if (maxRefundable <= 0) {
      return res.status(400).json({ message: "Transaction is already fully refunded" });
    }

    // Process and validate refund items with proper discount distribution
    const processedItems = [];
    let refundSubtotal = 0;
    
    for (const refundItem of items) {
      // Find the original line item
      const originalLine = transaction.items.id(refundItem.invoiceItemId);
      if (!originalLine) {
        return res.status(400).json({ 
          message: `Line item not found for this sale: ${refundItem.invoiceItemId}` 
        });
      }
      
      const refundQuantity = Number(refundItem.quantity) || 0;
      const originalQuantity = originalLine.quantity;
      
      // Validate quantity
      if (refundQuantity < 1 || refundQuantity > originalQuantity) {
        return res.status(400).json({ 
          message: `Invalid quantity for "${originalLine.name}". Available: ${originalQuantity}, Requested: ${refundQuantity}` 
        });
      }
      
      // Calculate the proportional refund for this line item BEFORE overall discount
      const originalLineTotal = originalLine.total;
      const proportionalTotalBeforeOverallDiscount = (refundQuantity / originalQuantity) * originalLineTotal;
      
      processedItems.push({
        invoiceItemId: refundItem.invoiceItemId,
        name: originalLine.name,
        type: originalLine.productId ? 'product' : 'service',
        quantity: refundQuantity,
        originalUnitPrice: originalLine.unitPrice,
        unitPrice: originalLine.unitPrice,
        discount: originalLine.discount || 0,
        subtotalBeforeOverallDiscount: proportionalTotalBeforeOverallDiscount,
      });
      
      refundSubtotal += proportionalTotalBeforeOverallDiscount;
    }
    
    // Calculate overall discount distribution
    const transactionSubtotal = transaction.subtotal || 0;
    const transactionTotal = transaction.total || 0;
    const overallDiscountAmount = transactionSubtotal - transactionTotal;
    
    let refundOverallDiscount = 0;
    let finalRefundTotal = refundSubtotal;
    
    if (overallDiscountAmount > 0 && transactionSubtotal > 0) {
      const refundShare = refundSubtotal / transactionSubtotal;
      refundOverallDiscount = refundShare * overallDiscountAmount;
      finalRefundTotal = refundSubtotal - refundOverallDiscount;
    }
    
    // Ensure we don't refund more than the remaining amount
    const finalTotal = Math.min(finalRefundTotal, maxRefundable, transaction.amountDue || transactionTotal);
    
    // Calculate the actual discounted unit price for each item
    let remainingRefundAmount = finalTotal;
    const processedItemsWithActualAmounts = processedItems.map((item, index) => {
      const itemShare = item.subtotalBeforeOverallDiscount / refundSubtotal;
      const itemActualRefundAmount = index === processedItems.length - 1 
        ? remainingRefundAmount
        : itemShare * finalTotal;
      
      remainingRefundAmount -= itemActualRefundAmount;
      const discountedUnitPrice = itemActualRefundAmount / item.quantity;
      
      return {
        invoiceItemId: item.invoiceItemId,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        originalUnitPrice: item.originalUnitPrice,
        unitPrice: discountedUnitPrice,
        discount: item.discount,
        subtotalBeforeDiscount: item.subtotalBeforeOverallDiscount,
        refundAmount: itemActualRefundAmount,
      };
    });
    
  
    
    // Create refund record (updated to include new fields)
    const refund = await Refund.create({
      invoiceId,
      invoiceNumber: transaction.transactionNumber,
      branchId: refundBranchId,
      customerId: transaction.customerId,
      customerName: transaction.customerName,
      type: type || (finalTotal >= transactionTotal ? "full" : "partial"),
      reason,
      items: processedItemsWithActualAmounts.map(item => ({
        invoiceItemId: item.invoiceItemId,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        unitPrice: item.unitPrice, // This is now the discounted price
        total: item.refundAmount, // This is the actual refund amount for this item
      })),
      total: finalTotal,
      processedBy: userId,
      is_void: false,
    });
    
    // Update product stock
    for (const processedItem of processedItemsWithActualAmounts) {
      const originalLine = transaction.items.id(processedItem.invoiceItemId);
      if (originalLine && originalLine.productId) {
        const product = await Product.findById(originalLine.productId);
        if (product) {
          const oldStock = product.stock;
          product.stock += processedItem.quantity;
          
          product.history = product.history || [];
          product.history.push({
            action: "refunded",
            quantity: processedItem.quantity,
            oldStock,
            newStock: product.stock,
            refundAmount: processedItem.refundAmount,
            date: new Date(),
            user: userId,
            userName: userName || req.user.name,
            reason: reason,
            refundId: refund._id,
          });
          
          await product.save();
        }
      }
    }
    
    // Update transaction with refund information
    const previousAmountDue = transaction.amountDue || transaction.total;
    transaction.amountDue = Math.max(0, previousAmountDue - finalTotal);
    
    // Update transaction status using valid enum values from your schema
    if (transaction.amountDue === 0) {
      transaction.status = "refunded";
    } else if (transaction.amountDue > 0 && transaction.amountDue < transaction.total) {
      // Use a value that exists in your enum
      // Your schema has: "partial", "partial_refund", "partially_refunded"
      transaction.status = "partial_refund";
    }
    
    // Track total refunded amount
    transaction.totalRefunded = (transaction.totalRefunded || 0) + finalTotal;
    
    // Add to transaction history
    transaction.history = transaction.history || [];
    transaction.history.push({
      action: "refund",
      details: {
        refundId: refund._id,
        refundNumber: refund.refundNumber,
        items: processedItemsWithActualAmounts.map(item => ({
          name: item.name,
          quantity: item.quantity,
          originalSubtotal: item.subtotalBeforeDiscount,
          refundAmount: item.refundAmount,
          unitPriceAfterDiscount: item.unitPrice,
        })),
        reason: reason,
        totalAmount: finalTotal,
        discountApplied: refundOverallDiscount,
      },
      user: userId,
      userName: userName || req.user.name,
      date: new Date(),
    });
    
    await transaction.save();
    
    // Return the created refund
    res.status(201).json({
      success: true,
      message: "Refund processed successfully",
      refund: {
        ...refund.toObject(),
        transactionStatus: transaction.status,
        remainingBalance: transaction.amountDue,
      },
    });
    
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to process refund",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Get all refunds
const getRefunds = async (req, res) => {
  try {
    const { branchId: queryBranchId } = req.query;
    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    const filter = {};
    if (isAdmin && queryBranchId) {
      if (mongoose.Types.ObjectId.isValid(queryBranchId)) {
        filter.branchId = queryBranchId;
      } else {
        const branch = await Branch.findOne({ branch_name: queryBranchId });
        if (!branch) {
          return res.status(404).json({ message: "Branch not found" });
        }
        filter.branchId = branch._id;
      }
    } else if (branch_id) {
      filter.branchId = branch_id;
    }

    const refunds = await Refund.find(filter)
      .populate("branchId", "branch_name")
      .populate("customerId", "name email")
      .populate("processedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(refunds);
  } catch (error) {
    console.error("Get refunds error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single refund by ID
const getRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await Refund.findById(id)
      .populate("branchId", "name")
      .populate("customerId", "name email")
      .populate("processedBy", "firstName lastName email");

    if (!refund) return res.status(404).json({ message: "Refund not found" });

    res.json(refund);
  } catch (error) {
    console.error("Get refund error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRefund,
  getRefunds,
  getRefund,
};