const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const CategoryPermissions = PERMISSIONS_OBJECT.INVENTORY?.CATEGORIES;

 
// All routes in this file require authentication
router.use(auth);

// Create a new category
router.post(
  '/',
  checkPermission([CategoryPermissions.CREATE]),
  categoryController.createCategory
);

// Get all categories
router.get(
  '/',
  checkPermission([CategoryPermissions.READ]),
  categoryController.getCategories
);

// Get single category
router.get(
  '/:id',
  checkPermission([CategoryPermissions.READ]),
  categoryController.getCategory
);

// Update a category by ID
router.put(
  '/:id',
  checkPermission([CategoryPermissions.UPDATE]),
  categoryController.updateCategory
);

// Soft delete a category by ID (set status to INACTIVE)
router.delete(
  '/:id',
  checkPermission([CategoryPermissions.DELETE]),
  categoryController.deleteCategory
);

// Toggle category status (ACTIVE/INACTIVE)
router.patch(
  '/:id/toggle',
  checkPermission([CategoryPermissions.UPDATE]),
  categoryController.toggleCategoryStatus
);

module.exports = router;