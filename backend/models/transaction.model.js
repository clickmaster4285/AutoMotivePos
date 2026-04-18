const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      unique: true,
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

    // 🛒 ITEMS (embedded directly, no separate schema)
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },

        discount: {
          type: Number, // %
          default: 0,
          min: 0,
          max: 100,
        },

        total: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    amountDue: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer", "split"],
      default: "cash",
    },

    status: {
      type: String,
      enum: ["paid", "partial", "unpaid", "refunded", "partial_refund", "partially_refunded"],
      default: "paid",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    is_void: {
      type: Boolean,
      default: false,
    },
      history: [
      {
        action: { type: String },          // e.g., "refunded", "updated"
        details: { type: Object, default: {} }, // optional info like refund items
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate transaction number before saving
transactionSchema.pre("save", function () {
  if (!this.transactionNumber) {
    this.transactionNumber = "TXN-" + Date.now();
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);