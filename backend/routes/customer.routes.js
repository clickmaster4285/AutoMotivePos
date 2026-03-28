const express = require("express");
const router = express.Router();

const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  softDeleteCustomer
} = require("../controllers/customer.controller");

// Permissions reference
const CustomerPermissions = PERMISSIONS_OBJECT.CUSTOMER_MANAGEMENT.CUSTOMERS;

// All routes require authentication
router.use(auth);

// CREATE customer (permission: create)
router.post("/", checkPermission([CustomerPermissions.CREATE]), createCustomer);

// GET all active customers (permission: read)
router.get("/", checkPermission([CustomerPermissions.READ]), getCustomers);

// GET single customer by ID (permission: read)
router.get("/:id", checkPermission([CustomerPermissions.READ]), getCustomerById);

// UPDATE customer (permission: update)
router.put("/:id", checkPermission([CustomerPermissions.UPDATE]), updateCustomer);

// SOFT DELETE customer (permission: delete)
router.delete("/:id", checkPermission([CustomerPermissions.DELETE]), softDeleteCustomer);

module.exports = router;