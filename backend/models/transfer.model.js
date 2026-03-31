const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    // Product
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    product_name: {
      type: String,
      required: true, // snapshot (important for history)
    },

    // FROM
    from_branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    from_branch_name: {
      type: String,
      required: true,
    },

    from_warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    from_warehouse_name: {
      type: String,
      required: true,
    },

    // TO
    to_branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    to_branch_name: {
      type: String,
      required: true,
    },

    to_warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    to_warehouse_name: {
      type: String,
      required: true,
    },

    // Transfer Details
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // User Info (who performed transfer)
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    user_name: {
      type: String,
      required: true,
    },

    // Status (for future use)
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "COMPLETED",
    },

    // Notes (optional)
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockTransfer", stockTransferSchema);