const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const Product = require("../models/product.model");



const createTransaction = async (req, res) => {
  try {
    let {
      branchId,
      items,
      customerId,
      customerName,
      paymentMethod,
      amountPaid,
      discountType,
      discountValue,
    } = req.body;

    const { _id: userId, role, branch_id: userBranchId } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    // 🔹 Override branchId for non-admin users
    if (!isAdmin) {
      branchId = userBranchId;
    }

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    const normalizedItems = [];

    for (const item of items) {
      const discountPct = Math.min(100, Math.max(0, Number(item.discount) || 0));
      const unitPrice = Number(item.unitPrice) || 0;
      const qty = Math.floor(Number(item.quantity) || 0);

      if (qty < 1) {
        return res
          .status(400)
          .json({ message: `Invalid quantity for ${item.name || "item"}` });
      }

      const lineTotal = qty * unitPrice * (1 - discountPct / 100);

      if (item.productId) {
        const product = await Product.findOne({
          _id: item.productId,
          branch_id: branchId,
          deleted: { $ne: true },
        });

        if (!product) {
          return res
            .status(400)
            .json({ message: `Product "${item.name}" not found in this branch` });
        }

        if (qty > (product.stock ?? 0)) {
          return res.status(400).json({
            message: `Insufficient stock for "${item.name}". Available: ${
              product.stock ?? 0
            }`,
          });
        }

        // 🔹 Update product stock and history
        const oldStock = product.stock;
        product.stock = oldStock - qty;

        product.history = product.history || [];
        product.history.push({
          action: "sold",
          quantity: qty,
          oldStock,
          newStock: product.stock,
          date: new Date(),
          user: userId,
        });

        await product.save();
      }

      normalizedItems.push({
        name: String(item.name || "Item").trim() || "Item",
        quantity: qty,
        unitPrice,
        discount: discountPct,
        total: lineTotal,
        ...(item.productId && { productId: item.productId }),
      });
    }

    const lineSubtotal = normalizedItems.reduce((sum, i) => sum + i.total, 0);
    const discType = discountType === "fixed" ? "fixed" : "percentage";
    const discVal = Number(discountValue) || 0;

    let discountAmount = 0;
    if (discType === "percentage") {
      discountAmount = lineSubtotal * (Math.min(100, Math.max(0, discVal)) / 100);
    } else {
      discountAmount = Math.min(lineSubtotal, Math.max(0, discVal));
    }

    const total = Math.max(0, lineSubtotal - discountAmount);
    const paidRaw = Number(amountPaid);
    const paid = Number.isFinite(paidRaw) ? Math.min(Math.max(0, paidRaw), total) : total;
    const amountDue = Math.max(0, total - paid);

    let status = "paid";
    if (amountDue > 0 && paid > 0) status = "partial";
    else if (amountDue > 0 && paid === 0) status = "unpaid";

    const transaction = await Transaction.create({
      branchId,
      customerId: customerId || undefined,
      customerName: customerName || "Walk-in Customer",
      items: normalizedItems,
      subtotal: lineSubtotal,
      discountType: discType,
      discountValue: discVal,
      discountAmount,
      total,
      amountPaid: paid,
      amountDue,
      paymentMethod: paymentMethod || "cash",
      status,
      createdBy: userId,
    });

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Transaction error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const { branchId: queryBranchId } = req.query;
    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    const filter = {};
    if (isAdmin) {
      if (queryBranchId) filter.branchId = queryBranchId;
    } else if (branch_id) {
      filter.branchId = branch_id;
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get single transaction by ID
const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransaction,
};