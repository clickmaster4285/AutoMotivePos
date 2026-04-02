const mongoose = require("mongoose");

// 🔹 Embedded schema for refund items
const refundItemSchema = new mongoose.Schema(
  {
    invoiceItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String, // "product" or "service"
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false } // keep it embedded without its own _id
);

// 🔹 Main Refund schema
const refundSchema = new mongoose.Schema(
  {
    refundNumber: {
      type: String,
      unique: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      default: "Walk-in Customer",
      trim: true,
    },
    type: {
      type: String,
      enum: ["full", "partial"],
      default: "full",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    items: [refundItemSchema],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    is_void: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔹 Auto-generate refund number
refundSchema.pre("save", async function () {
  if (!this.refundNumber) {
    this.refundNumber = "RFND-" + Date.now();
  }
});

module.exports = mongoose.model("Refund", refundSchema);