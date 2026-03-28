// routes/settings.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");
const { PERMISSIONS_OBJECT } = require("../config/permissions");
const settingsController = require("../controllers/settings.controller");
const upload = require("../middlewares/upload"); // multer setup

const SettingsPermissions = PERMISSIONS_OBJECT.SETTINGS; // adjust if needed

// Apply auth middleware globally for all settings routes
router.use(auth);

router.get(
  "/",
  checkPermission([SettingsPermissions.STORE_SETTINGS.READ]),
  settingsController.getSettings
);

// For updating "Store Settings"
router.put(
  "/",
  checkPermission([SettingsPermissions.STORE_SETTINGS.UPDATE]),
  upload.single("logo"),
  settingsController.updateSettings
);

router.put(
  "/profile",
  checkPermission([SettingsPermissions.STORE_SETTINGS.UPDATE]),
  settingsController.updateProfile
);
module.exports = router;
