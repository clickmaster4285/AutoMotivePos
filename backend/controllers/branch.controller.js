const mongoose = require("mongoose");
const Branch = require("../models/branch.model");

/**
 * CREATE BRANCH
 */
exports.createBranch = async (req, res) => {
  try {
    console.log("Received branch data:", req.body);

    // Ensure branch_manager is undefined if empty
    const branchData = {
      branch_name: req.body.branch_name,
      tax_region: req.body.tax_region,
      opening_time: req.body.opening_time,
      closing_time: req.body.closing_time,
      status: req.body.status || "ACTIVE",
      branch_manager: req.body.branch_manager || undefined,
      address: req.body.address || {},
    };

    const branch = await Branch.create(branchData);

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch
    });

  } catch (error) {
    console.error("Branch creation error:", error); // detailed log
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors || null
    });
  }
};
/**
 * GET ALL BRANCHES (ACTIVE ONLY)
 */
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find(
      {
        // status: { $ne: "INACTIVE" }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET SINGLE BRANCH
 */
exports.getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch id"
      });
    }

    const branch = await Branch.findOne({
      _id: id,
      // status: { $ne: "INACTIVE" }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE BRANCH
 */
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findOneAndUpdate(
      { _id: id, status: { $ne: "INACTIVE" } },
      req.body,
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or inactive"
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: branch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



exports.toggleBranchStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // 🔁 TOGGLE STATUS
    const newStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    branch.status = newStatus;
    await branch.save();

    res.status(200).json({
      success: true,
      message: `Branch ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

