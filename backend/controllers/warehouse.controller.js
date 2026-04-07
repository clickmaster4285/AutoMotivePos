const Warehouse = require("../models/warehouse.model");

function normalizeWarehouseInput(name, code) {
  return {
    normalizedName: typeof name === "string" ? name.trim() : "",
    normalizedCode: typeof code === "string" ? code.trim().toUpperCase() : "",
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const createWarehouse = async (req, res) => {

 
  try {
    const { name, code, warehouse_type, status, location, branch_id } = req.body;
    const { normalizedName, normalizedCode } = normalizeWarehouseInput(name, code);

    // Determine final branch_id based on user role
    let finalBranchId;
    
    if (req.user.role === "admin") {
      // Admin can specify branch_id in request body or use their own branch_id
      finalBranchId = branch_id || req.user?.branch_id;
    } else {
      // Non-admin users must use their own branch_id, ignore any branch_id from request body
      finalBranchId = req.user?.branch_id;
      
      // If request body contains branch_id that doesn't match user's branch, log warning
      if (branch_id && branch_id !== req.user?.branch_id) {
        console.warn(`Non-admin user ${req.user.id} attempted to create warehouse for branch ${branch_id} but was restricted to branch ${req.user?.branch_id}`);
      }
    }

    // Validate required fields
    if (!finalBranchId) {
      return res.status(400).json({
        message: "branch_id is required",
      });
    }

    if (!normalizedName) {
      return res.status(400).json({
        message: "name is required",
      });
    }

    if (!normalizedCode) {
      return res.status(400).json({
        message: "code is required",
      });
    }

    // Check if warehouse with same code already exists (global)
    const existingCodeWarehouse = await Warehouse.findOne({ code: normalizedCode , status: "ACTIVE" });
    if (existingCodeWarehouse) {
      return res.status(400).json({
        message: "Warehouse with this code already exists",
      });
    }

 
const existingNameWarehouse = await Warehouse.findOne({
  branch_id: finalBranchId,
  name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
  status: "ACTIVE", // <--- only consider active warehouses
});

if (existingNameWarehouse) {
  return res.status(400).json({
    message: "Warehouse with this name already exists in this branch",
  });
}

    // Create warehouse
    const warehouse = new Warehouse({
      branch_id: finalBranchId,
      name: normalizedName,
      code: normalizedCode,
      warehouse_type: warehouse_type || "MAIN",
      status: status || "ACTIVE",
      location: location || {},
    });

    await warehouse.save();

    res.status(201).json({
      message: "Warehouse created successfully",
      warehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error);
    
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        message:
          key === "code"
            ? "Warehouse with this code already exists"
            : "Warehouse with this name already exists in this branch",
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, warehouse_type, status, location, branch_id } = req.body;
    const { normalizedName, normalizedCode } = normalizeWarehouseInput(name, code);

    // Find existing warehouse
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    // Check if code is being changed and if it already exists
    if (normalizedCode && normalizedCode !== warehouse.code) {
      const existingWarehouse = await Warehouse.findOne({ code: normalizedCode, _id: { $ne: id } });
      if (existingWarehouse) {
        return res.status(400).json({
          message: "Warehouse with this code already exists",
        });
      }
    }

    const targetBranchId = branch_id || warehouse.branch_id;
   if (normalizedName && normalizedName.toLowerCase() !== String(warehouse.name || "").trim().toLowerCase()) {
  const existingNameWarehouse = await Warehouse.findOne({
    branch_id: targetBranchId,
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
    _id: { $ne: id },
    status: "ACTIVE", // <--- only check active warehouses
  });
  if (existingNameWarehouse) {
    return res.status(400).json({
      message: "Warehouse with this name already exists in this branch",
    });
  }
}

    // Update fields
    if (normalizedName) warehouse.name = normalizedName;
    if (normalizedCode) warehouse.code = normalizedCode;
    if (warehouse_type) warehouse.warehouse_type = warehouse_type;
    if (status) warehouse.status = status;
    if (branch_id) warehouse.branch_id = branch_id;
    if (location) warehouse.location = location;

    await warehouse.save();

    res.status(200).json({
      message: "Warehouse updated successfully",
      warehouse,
    });
  } catch (error) {
    console.error("Update warehouse error:", error);
    
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        message:
          key === "code"
            ? "Warehouse with this code already exists"
            : "Warehouse with this name already exists in this branch",
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};




const getWarehouses = async (req, res) => {
  try {
    let query = { status: "ACTIVE" };
    if (req.user.role !== "admin") {
     
      query.branch_id = req.user.branch_id;
    } else {
      console.log("Admin fetching all warehouses");
    }
    const warehouses = await Warehouse.find(query).populate("branch_id", "branch_name");
    res.status(200).json({ warehouses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getWarehouseByBranch = async (req, res) => {
  try {
    let query = { status: "ACTIVE" };
    const { branchId } = req.params; // Get from URL parameter
    
    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }
    
    query.branch_id = branchId;
    
    const warehouses = await Warehouse.find(query).populate("branch_id", "branch_name");
    res.status(200).json({ warehouses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findOne({ _id: id, status: "ACTIVE" }).populate("branch_id", "branch_name");

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.status(200).json({ warehouse });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};





const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { status: "INACTIVE" },
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.status(200).json({ message: "Warehouse soft-deleted successfully", warehouse });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,

  getWarehouseByBranch,
};