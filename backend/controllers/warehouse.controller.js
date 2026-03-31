const Warehouse = require("../models/warehouse.model");

const createWarehouse = async (req, res) => {
  try {
   
    console.log("req.body", req.body);
    const { name, warehouse_type, status, location } = req.body;

    const branch_id = req.user.branch_id; // ✅ take from logged-in user

    // Ensure required fields
    if (!name) {
      return res.status(400).json({
        message: "branch_id (from user) and name are required",
      });
    }

    // Create warehouse
    const warehouse = new Warehouse({
      branch_id,
      name,
      warehouse_type,
      status,
      location,
    });

    await warehouse.save();

    res.status(201).json({
      message: "Warehouse created successfully",
      warehouse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Warehouse with this name already exists in this branch",
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
    const warehouses = await Warehouse.find().populate("branch_id", "branch_name");
    res.status(200).json({ warehouses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findById(id).populate("branch_id", "branch_name");

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.status(200).json({ warehouse });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const warehouse = await Warehouse.findByIdAndUpdate(id, updateData, { new: true });

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.status(200).json({ message: "Warehouse updated successfully", warehouse });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Warehouse with this name already exists in this branch" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByIdAndDelete(id);

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.status(200).json({ message: "Warehouse deleted successfully" });
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
};