const express = require('express');
const router = express.Router();

const warehouseController = require('../controllers/warehouse.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const WarehousePermissions =
  PERMISSIONS_OBJECT.WAREHOUSE.WAREHOUSE_MANAGEMENT;

router.use(auth);

// Create
router.post(
  '/',
  checkPermission([WarehousePermissions.CREATE]),
  warehouseController.createWarehouse
);

// Get all
router.get(
  '/',
  checkPermission([WarehousePermissions.READ]),
  warehouseController.getWarehouses
);

// Get one
router.get(
  '/:id',
  checkPermission([WarehousePermissions.READ]),
  warehouseController.getWarehouseById
);

// Update
router.put(
  '/:id',
  checkPermission([WarehousePermissions.UPDATE]),
  warehouseController.updateWarehouse
);

// Delete
router.delete(
  '/:id',
  checkPermission([WarehousePermissions.DELETE]),
  warehouseController.deleteWarehouse
);

module.exports = router;