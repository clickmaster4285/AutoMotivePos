const express = require('express');
const router = express.Router();

const supplierController = require('../controllers/supplier.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const VendorPermissions = PERMISSIONS_OBJECT.INVENTORY.VENDOR_MANAGEMENT;

// All routes in this file require authentication
router.use(auth);

// Create a new supplier
router.post(
  '/',
  checkPermission([VendorPermissions.CREATE]),  // ✅ fixed
  supplierController.createSupplier
);

// Get all suppliers
router.get(
  '/',
  checkPermission([VendorPermissions.READ]),  // ✅ fixed
  supplierController.getAllSuppliers
);

// Get a single supplier by ID
router.get(
  '/:id',
  checkPermission([VendorPermissions.READ]),  // ✅ fixed
  supplierController.getSupplierById
);

// Update a supplier by ID
router.put(
  '/:id',
  checkPermission([VendorPermissions.UPDATE]),  // ✅ fixed
  supplierController.updateSupplier
);

// Soft delete a supplier by ID
router.delete(
  '/:id',
  checkPermission([VendorPermissions.DELETE]),  // ✅ fixed
  supplierController.deleteSupplier
);

module.exports = router;
