const express = require('express');
const router = express.Router();

const refundController = require('../controllers/refund.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Refund permissions from SYSTEM_HIERARCHY → Point of Sale → Returns Exchanges
const RefundPermissions = PERMISSIONS_OBJECT.POINT_OF_SALE.RETURNS_EXCHANGES;

// All routes require authentication
router.use(auth);

// Create a refund
router.post(
  '/',
  checkPermission([RefundPermissions.CREATE]),
  refundController.createRefund
);

// Get all refunds
router.get(
  '/',
  checkPermission([RefundPermissions.READ]),
  refundController.getRefunds
);

// Get single refund by ID
router.get(
  '/:id',
  checkPermission([RefundPermissions.READ]),
  refundController.getRefund
);

module.exports = router;