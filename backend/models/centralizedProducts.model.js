const mongoose = require("mongoose");

const centralizedProductSchema = new mongoose.Schema(
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
      uppercase: true,
      trim: true,
      unique: true, // SKU must be unique globally
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    mainWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: false,
      default: null,
    },

    // Pricing
    cost: {
      type: Number,
      required: true,
      default: 0,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    // Total stock across all branches
    totalStock: {
      type: Number,
      required: true,
      default: 0,
    },

    // Optional history for stock changes
    history: [
      {
        action: { type: String }, // e.g., "added", "sold", "transferred"
        quantity: { type: Number },
        note: { type: String },
        date: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Optional: Index SKU for faster lookups
centralizedProductSchema.index({ sku: 1 }, { unique: true });

module.exports = mongoose.model("CentralizedProduct", centralizedProductSchema, "centralizedproducts");