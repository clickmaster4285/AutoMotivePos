const express = require('express');
const router = express.Router();

const stockTransferController = require('../controllers/transfer.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const TransferPermissions = PERMISSIONS_OBJECT.INVENTORY.STOCK_MANAGEMENT;

// All routes require auth
router.use(auth);

// Create new stock transfer
router.post(
  '/',
  checkPermission([TransferPermissions.CREATE]),
  stockTransferController.createStockTransfer
);

// Get all stock transfers
router.get(
  '/',
  checkPermission([TransferPermissions.READ]),
  stockTransferController.getStockTransfers
);
router.get(
  '/:id',
  checkPermission([TransferPermissions.READ]),
  stockTransferController.getStockTransferById
);
router.put(
  '/:id',
  checkPermission([TransferPermissions.UPDATE]),
  stockTransferController.updateStockTransfer
);

module.exports = router;