const mongoose = require("mongoose");
const Refund = require("../models/refund.model");
const Transaction = require("../models/transaction.model");
const Product = require("../models/product.model");
const Branch = require("../models/branch.model");


// Create a refund
const createRefund = async (req, res) => {
  try {

    console.log("Refund request body:", req.body);
    const { invoiceId, type, reason, items } = req.body;
    const { _id: userId, role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

     const transaction = await Transaction.findById(invoiceId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    
    const refundBranchId = isAdmin ? transaction.branchId : branch_id;

    if (!invoiceId || !reason || !items || items.length === 0) {
      return res.status(400).json({ message: "Invoice, reason, and items are required" });
    }

   

    if (!isAdmin && branch_id && String(transaction.branchId) !== String(branch_id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Validate refund items
    for (const refundItem of items) {
      const line = transaction.items.id(refundItem.invoiceItemId);
      if (!line) {
        return res.status(400).json({ message: `Line item not found for this sale` });
      }
      const rq = Number(refundItem.quantity) || 0;
      if (rq < 1 || rq > line.quantity) {
        return res.status(400).json({ message: `Invalid quantity for "${line.name}"` });
      }
    }

    // Calculate total refund amount
    const totalRefund = items.reduce((sum, item) => sum + Number(item.total) || 0, 0);

    // Create refund record
    const refund = await Refund.create({
      invoiceId,
      invoiceNumber: transaction.transactionNumber,
      branchId: refundBranchId,
      customerId: transaction.customerId,
      customerName: transaction.customerName,
      type: type || "full",
      reason,
      items,
      total: totalRefund,
      processedBy: userId,
    });

    // Update product stock and add product history
    for (const refundItem of items) {
      const line = transaction.items.id(refundItem.invoiceItemId);
      if (line && line.productId) {
        const rq = Number(refundItem.quantity) || 0;
        const product = await Product.findById(line.productId);
        if (product) {
          const oldStock = product.stock;
          product.stock += rq;

          // Add history for refund
          product.history = product.history || [];
          product.history.push({
            action: "refunded",
            quantity: rq,
            oldStock,
            newStock: product.stock,
            date: new Date(),
            user: userId,
          });

          await product.save();
        }
      }
    }

    // 🔹 Update transaction status and history
    transaction.amountPaid = transaction.amountPaid; // keep as-is
    transaction.amountDue = Math.max(0, transaction.total - transaction.amountPaid - totalRefund);

    if (transaction.amountDue === 0) {
      transaction.status = "refunded"; // fully refunded
    } else if (transaction.amountDue > 0 && totalRefund > 0) {
      transaction.status = "partially_refunded";
    }

    // Add transaction history
    transaction.history = transaction.history || [];
    transaction.history.push({
      action: "refund",
      details: { refundId: refund._id, items },
      user: userId,
      date: new Date(),
    });

    await transaction.save();

    res.status(201).json(refund);
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({ message: error.message });
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