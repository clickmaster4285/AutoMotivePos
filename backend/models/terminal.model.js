const mongoose = require("mongoose");

const terminalSchema = new mongoose.Schema(
  {
    terminalId: { type: String, required: true, unique: true },
    terminalName: { type: String, required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    location: { type: String },

    // Users: employee or supplier with dynamic ref
    users: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'users.roleRef' // Dynamic reference based on roleRef field
        },
        role: { type: String, enum: ["employee", "supplier"], required: true },
        roleRef: { type: String, required: true, enum: ["User", "Supplier"] }, // Points to which collection
      },
    ],

    // Actions log
    actions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'actions.roleRef' // Dynamic reference for actions too
        },
        role: { type: String, enum: ["employee", "supplier"], required: true },
        roleRef: { type: String, required: true, enum: ["User", "Supplier"] },
        actionType: { type: String, required: true },
        description: { type: String },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Terminal", terminalSchema);