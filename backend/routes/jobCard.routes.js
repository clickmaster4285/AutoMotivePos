// backend/routes/jobCard.routes.js
const express = require('express');
const router = express.Router();

const jobCardController = require('../controllers/jobCard.controller');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Job Card Permissions
const JobCardPermissions = PERMISSIONS_OBJECT.INVENTORY?.['JOB_CARD_MANAGEMENT'];

// All routes require authentication
router.use(auth);

// Create a new Job Card
router.post(
  '/',
  checkPermission([JobCardPermissions.CREATE]),
  jobCardController.createJobCard
);

// Get all Job Cards (with optional branch filter for admin)
router.get(
  '/',
  checkPermission([JobCardPermissions.READ]),
  jobCardController.getJobCards
);

// Get Job Cards by branch ID
router.get(
  '/',
  checkPermission([JobCardPermissions.READ]),
  jobCardController.getJobCards
);

// Get single Job Card
router.get(
  '/:id',
  checkPermission([JobCardPermissions.READ]),
  jobCardController.getJobCardById
);

// Update a Job Card
router.put(
  '/:id',
  checkPermission([JobCardPermissions.UPDATE]),
  jobCardController.updateJobCard
);

// Soft delete a Job Card
router.delete(
  '/:id',
  checkPermission([JobCardPermissions.DELETE]),
  jobCardController.deleteJobCard
);

// Update Job Card status (like in the frontend select)
router.patch(
  '/:id/status',
  checkPermission([JobCardPermissions.UPDATE]),
  jobCardController.updateJobStatus
);

module.exports = router;