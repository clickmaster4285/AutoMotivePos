const express = require('express');
const router = express.Router();

const centralizedProductController = require('../controllers/centralizedProduct.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const CentralizedPermissions = PERMISSIONS_OBJECT.INVENTORY.CENTRALIZED_INVENTORY;

// All routes require auth
router.use(auth);

// Create a centralized product
router.post(
  '/',
  checkPermission([CentralizedPermissions.CREATE]),
  centralizedProductController.createCentralizedProduct
);

// Get all centralized products
router.get(
  '/',
  checkPermission([CentralizedPermissions.READ]),
  centralizedProductController.getCentralizedProducts
);

// Get single centralized product
router.get(
  '/:id',
  checkPermission([CentralizedPermissions.READ]),
  centralizedProductController.getCentralizedProductById
);

// Update centralized product (name, category, cost, etc.)
router.put(
  '/:id',
  checkPermission([CentralizedPermissions.UPDATE]),
  centralizedProductController.updateCentralizedProduct
);

// Delete (soft delete) centralized product
router.delete(
  '/:id',
  checkPermission([CentralizedPermissions.DELETE]),
  centralizedProductController.deleteCentralizedProduct
);

// Adjust stock
router.patch(
  '/:id/adjust',
  checkPermission([CentralizedPermissions.UPDATE]),
  centralizedProductController.adjustCentralizedProductStock
);

// Update price only
router.patch(
  '/:id/price',
  checkPermission([CentralizedPermissions.UPDATE]),
  centralizedProductController.updateCentralizedProductPrice
);

module.exports = router;