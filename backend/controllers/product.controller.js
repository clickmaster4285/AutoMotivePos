const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    const branch_id = req.user.branch_id;

    const {
      name,
      sku,
      category,
      price,
      cost,
      stock,
      minStock,
      warehouse_id,
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

    let filter = { deleted: false };

    if (role !== "ADMIN") {
      filter.branch_id = branch_id; // ✅ restrict
    }

    const products = await Product.find(filter)
      .populate("warehouse_id", "warehouse_name")
      .sort({ createdAt: -1 });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, branch_id } = req.user;

    let filter = { _id: id };

    if (role !== "ADMIN") {
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

    let filter = { _id: id };

    if (role !== "ADMIN") {
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

    let filter = { _id: id };

    if (role !== "ADMIN") {
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
    updateProduct,
    deleteProduct,
    adjustStock
};
