const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Branch = require("../models/branch.model");

// CREATE CUSTOMER
exports.createCustomer = async (req, res) => {
  try {
    console.log("req.body", req.body);

    // Determine branch_id based on user role
    const branch_id =
      req.user.role !== "admin" ? req.user.branch_id : req.body.branch_id;

    // Validate branch exists
    const branchExists = await Branch.findById(branch_id);
    if (!branchExists) {
      return res.status(400).json({ success: false, message: "Invalid branch_id" });
    }

    // Create customer with the correct branch_id
    const customerData = {
      ...req.body,
      branch_id, // override branch_id regardless of what was in req.body
    };

    const customer = await Customer.create(customerData);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET ALL ACTIVE CUSTOMERS
exports.getCustomers = async (req, res) => {
  try {
    const query = { status: "ACTIVE" };

    // If user is not admin, filter by their branch_id
    if (req.user.role !== "admin") {
      query.branch_id = req.user.branch_id;
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// GET SINGLE CUSTOMER
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE CUSTOMER
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOneAndUpdate(
      { _id: id, status: "ACTIVE" },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found or inactive" });
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// SOFT DELETE CUSTOMER
exports.softDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer || customer.status === "INACTIVE")
      return res.status(404).json({ success: false, message: "Customer not found or already inactive" });

    customer.status = "INACTIVE";
    await customer.save();

    res.status(200).json({ success: true, message: "Customer soft deleted successfully", data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};