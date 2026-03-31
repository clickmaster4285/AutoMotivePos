const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {


    console.log(req.body)
   
    const {
      name,
      sku,
      category,
      price,
      cost,
      stock,
      minStock,
      warehouse_id,
      branch_id,
    } = req.body;

    const product = new Product({
      name,
      sku,
      category,
      price,
      cost,
      stock,
      minStock,
      warehouse_id,
      branch_id, // ✅ from user
    });

    await product.save();

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    // Include products where `deleted` is missing (older records) and exclude only hard-marked deleted ones.
    let filter = { deleted: { $ne: true } };

    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    const products = await Product.find(filter)
      .populate("warehouse_id", "name code")
      .populate("branch_id", "branch_name")
      .populate("category", "categoryName") // ✅ category populate
      .sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ GET SINGLE PRODUCT
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    let filter = { _id: id, deleted: { $ne: true } };

    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    const product = await Product.findOne(filter)
      .populate("warehouse_id", "name code")
      .populate("branch_id", "branch_name")
      .populate("categoryId", "categoryName");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    let filter = { _id: id };

    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    const product = await Product.findOneAndUpdate(filter, req.body, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Updated", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    let filter = { _id: id };

    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { deleted: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    let filter = { _id: id };

    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    const product = await Product.findOne(filter);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.stock += quantity;

    if (product.stock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    await product.save();

    res.json({ message: "Stock updated", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,     
  updateProduct,
  deleteProduct,
  adjustStock
};