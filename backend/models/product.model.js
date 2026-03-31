const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

       category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },


    // Pricing
    cost: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      default: 0,
    },

    // Inventory
    stock: {
      type: Number,
      default: 0,
    },

    minStock: {
      type: Number,
      default: 5,
    },

    // Relations
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    // Soft delete
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);