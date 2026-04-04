const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true }, // e.g. created/updated/deleted
    module: { type: String, required: true, trim: true }, // e.g. inventory, pos, jobs
    details: { type: String, required: true, trim: true },

    entityId: { type: mongoose.Schema.Types.ObjectId, required: false },
    entityType: { type: String, required: false, trim: true },

    // Actor
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    userName: { type: String, required: false, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: false },

    // Request metadata
    method: { type: String, required: false, trim: true },
    path: { type: String, required: false, trim: true },
    statusCode: { type: Number, required: false },
    ip: { type: String, required: false, trim: true },
    userAgent: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ branchId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);

