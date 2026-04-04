const mongoose = require("mongoose");
const AuditLog = require("../models/auditLog.model");

function isAdminRole(role) {
  return String(role || "").toLowerCase() === "admin";
}

// GET /api/audit-logs?module=&search=&branchId=&limit=&from=&to=
const getAuditLogs = async (req, res) => {
  try {
    const { module, search, branchId, limit, from, to } = req.query;
    const { role, branch_id } = req.user || {};

    const filter = {};

    // Scope: admin can query any branch; non-admin restricted to own branch
    if (isAdminRole(role)) {
      if (branchId) filter.branchId = branchId;
    } else if (branch_id) {
      filter.branchId = branch_id;
    }

    if (module && module !== "all") {
      filter.module = module;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (search) {
      const q = String(search).trim();
      if (q) {
        filter.$or = [
          { details: { $regex: q, $options: "i" } },
          { userName: { $regex: q, $options: "i" } },
          { action: { $regex: q, $options: "i" } },
          { entityType: { $regex: q, $options: "i" } },
        ];
        if (mongoose.Types.ObjectId.isValid(q)) {
          filter.$or.push({ entityId: q });
        }
      }
    }

    const take = Math.min(500, Math.max(1, parseInt(limit, 10) || 200));

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(take);

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAuditLogs,
};

