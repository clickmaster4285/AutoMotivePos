const express = require("express");
const router = express.Router();

const auth = require('../middlewares/auth');

const checkPermission = require('../middlewares/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');


const {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  toggleBranchStatus
} = require("../controllers/branch.controller");

const BranchPermissions = PERMISSIONS_OBJECT.BRANCH.BRANCH_MANAGEMENT;

router.use(auth);
router.post("/", checkPermission([BranchPermissions.CREATE]), createBranch);
router.get("/", checkPermission([BranchPermissions.READ]), getAllBranches);

router.get("/:id", checkPermission([BranchPermissions.READ]), getBranchById);
router.put("/:id", checkPermission([BranchPermissions.UPDATE]), updateBranch);
router.delete("/:id", auth, checkPermission([BranchPermissions.DELETE]), toggleBranchStatus);

module.exports = router;
