const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const ProductPermissions = PERMISSIONS_OBJECT.INVENTORY.PRODUCT_DATABASE;

// All routes require auth
router.use(auth);

// Create a product
router.post(
  '/',
  checkPermission([ProductPermissions.CREATE]),
  productController.createProduct
);

// Get all products
router.get(
  '/',
  checkPermission([ProductPermissions.READ]),
  productController.getProducts
);

// Get single product
router.get(
  '/:id',
  checkPermission([ProductPermissions.READ]),
  productController.getProduct
);

// Update product
router.put(
  '/:id',
  checkPermission([ProductPermissions.UPDATE]),
  productController.updateProduct
);

// Delete (soft delete) product
router.delete(
  '/:id',
  checkPermission([ProductPermissions.DELETE]),
  productController.deleteProduct
);

// Adjust stock
router.patch(
  '/:id/adjust',
  checkPermission([ProductPermissions.UPDATE]),
  productController.adjustStock
);

module.exports = router;