const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");
const { PERMISSIONS_OBJECT } = require("../config/permissions");
const auditLogController = require("../controllers/auditLog.controller");

const SettingsPermissions = PERMISSIONS_OBJECT.SETTINGS;

router.use(auth);

// Read audit logs (reuse Security Settings READ permission)
router.get(
  "/",
  checkPermission([SettingsPermissions.SECURITY_SETTINGS.READ]),
  auditLogController.getAuditLogs
);

module.exports = router;

