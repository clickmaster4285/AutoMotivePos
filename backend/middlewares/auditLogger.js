const AuditLog = require("../models/auditLog.model");

function isAdminRole(role) {
  return String(role || "").toLowerCase() === "admin";
}

function inferModule(req) {
  const base = String(req.baseUrl || "");
  // baseUrl for /api/products => /api/products
  const parts = base.split("/").filter(Boolean);
  const resource = parts[1] || parts[0] || "";

  // Map resources to frontend module slugs
  if (["auth"].includes(resource)) return "auth";
  if (["products", "categories", "warehouses", "transfers", "centralizedproducts"].includes(resource)) return "inventory";
  if (["job-cards"].includes(resource)) return "jobs";
  if (["transactions"].includes(resource)) return "pos";
  if (["refunds"].includes(resource)) return "refunds";
  if (["customers"].includes(resource)) return "customers";
  if (["suppliers"].includes(resource)) return "suppliers";
  if (["branches"].includes(resource)) return "branch";
  if (["users"].includes(resource)) return "settings";

  return resource || "system";
}

function inferAction(req) {
  const m = String(req.method || "").toUpperCase();
  if (m === "POST") return "create";
  if (m === "PUT" || m === "PATCH") return "update";
  if (m === "DELETE") return "delete";
  return "read";
}

function sanitizeBody(body) {
  if (!body || typeof body !== "object") return undefined;
  const clone = Array.isArray(body) ? body.slice(0, 20) : { ...body };
  const redactKeys = ["password", "pin", "token", "accessToken", "refreshToken"];
  for (const k of redactKeys) {
    if (k in clone) clone[k] = "[REDACTED]";
  }
  return clone;
}

// Logs non-GET requests after response finishes.
module.exports = function auditLogger(req, res, next) {
  const method = String(req.method || "").toUpperCase();
  if (method === "GET" || method === "OPTIONS") return next();

  const started = Date.now();

  res.on("finish", async () => {
    try {
      // Only log successful-ish writes
      if (res.statusCode >= 400) return;

      const user = req.user || {};
      const module = inferModule(req);
      const action = inferAction(req);

      const detailsObj = {
        method,
        path: req.originalUrl,
        ms: Date.now() - started,
        body: sanitizeBody(req.body),
        query: req.query,
      };

      await AuditLog.create({
        action,
        module,
        details: JSON.stringify(detailsObj),
        userId: user._id,
        userName:
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email ||
          user.userId,
        branchId: user.branch_id || undefined,
        method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (_e) {
      // Never block request completion
    }
  });

  next();
};

