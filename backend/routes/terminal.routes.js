const express = require("express");
const router = express.Router();
const terminalCtrl = require('../controllers/terminalController');
const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");
const { PERMISSIONS_OBJECT } = require("../config/permissions");

// Access the permission object
const TerminalPermissions = PERMISSIONS_OBJECT.EMPLOYEE.TERMINAL_MANAGEMENT;

// All terminal routes require auth
router.use(auth);

// Terminal CRUD
router.post(
  "/",
  checkPermission([TerminalPermissions.CREATE]),
  terminalCtrl.createTerminal
);

router.put(
  "/:id",
  checkPermission([TerminalPermissions.UPDATE]),
  terminalCtrl.updateTerminalDetails 
);

router.get(
  "/",
  checkPermission([TerminalPermissions.READ]),
  terminalCtrl.listTerminals
);

router.get(
  "/:id",
  checkPermission([TerminalPermissions.READ]),
  terminalCtrl.getTerminal
);

// Manage users
router.put(
  "/:id/users",
  checkPermission([TerminalPermissions.UPDATE]),
  terminalCtrl.addUserToTerminal
);



router.delete(
  "/:id/users/:userId",
  checkPermission([TerminalPermissions.UPDATE]),
  terminalCtrl.removeUserFromTerminal
);

// Record actions
router.post(
  "/:terminalId/actions",
  checkPermission([TerminalPermissions.UPDATE]),
  terminalCtrl.recordAction
);

module.exports = router;
