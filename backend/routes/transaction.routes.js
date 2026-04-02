const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transaction.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const TransactionPermissions = PERMISSIONS_OBJECT.POINT_OF_SALE.TRANSACTION;

// All routes require authentication
router.use(auth);

// Create a transaction
router.post(
  '/',
  checkPermission([TransactionPermissions.CREATE]),
  transactionController.createTransaction
);

// Get all transactions
router.get(
  '/',
  checkPermission([TransactionPermissions.READ]),
  transactionController.getAllTransactions
);

// Get single transaction by ID
router.get(
  '/:id',
  checkPermission([TransactionPermissions.READ]),
  transactionController.getTransaction
);


module.exports = router;