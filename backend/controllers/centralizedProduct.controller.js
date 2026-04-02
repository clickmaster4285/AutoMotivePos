const mongoose = require("mongoose");
const CentralizedProduct = require("../models/centralizedProducts.model");

// Utility to generate SKU
function generateSKU(name) {
  const prefix = name
    ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "")
    : "PRD";
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNumber}`;
}

// ================================
// CREATE Centralized Product
// ================================
const createCentralizedProduct = async (req, res) => {
  try {
    const { name, sku, category, price, cost, totalStock, mainWarehouse, supplier_id } = req.body;

    if (!name || !category || !mainWarehouse) {
      return res.status(400).json({ message: "Name, category, and mainWarehouse are required." });
    }

    const finalSKU = sku && sku.trim() !== "" ? sku.toUpperCase() : generateSKU(name);

    // Check for duplicate SKU
    const existing = await CentralizedProduct.findOne({ sku: finalSKU });
    if (existing) {
      return res.status(400).json({ message: "SKU already exists. Try again." });
    }

    const newProduct = await CentralizedProduct.create({
      name: name.trim(),
      sku: finalSKU,
      category: new mongoose.Types.ObjectId(category),
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      totalStock: parseInt(totalStock) || 0,
      mainWarehouse: new mongoose.Types.ObjectId(mainWarehouse),
      ...(supplier_id ? { supplier_id: new mongoose.Types.ObjectId(supplier_id) } : {}),
    });

    res.status(201).json({ message: "Centralized product created successfully.", product: newProduct });
  } catch (error) {
    console.error("Create CentralizedProduct error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL PRODUCTS
// ================================
const getCentralizedProducts = async (req, res) => {
  try {
    const products = await CentralizedProduct.find({ deleted: { $ne: true } })
      .populate("category", "categoryName")
      .populate("mainWarehouse", "name code")
      .populate("supplier_id", "company_name contact_person phone email")
      .sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    console.error("Get CentralizedProducts error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET SINGLE PRODUCT
// ================================
const getCentralizedProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await CentralizedProduct.findById(id)
      .populate("category", "categoryName")
      .populate("mainWarehouse", "name code")
      .populate("supplier_id", "company_name contact_person phone email");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ product });
  } catch (error) {
    console.error("Get CentralizedProduct by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// UPDATE PRODUCT
// ================================
const updateCentralizedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, price, cost, totalStock, mainWarehouse, status, supplier_id } = req.body;

    const updatedData = {};

    if (name) updatedData.name = name.trim();
    if (sku) updatedData.sku = sku.toUpperCase();
    if (category) updatedData.category = new mongoose.Types.ObjectId(category);
    if (price !== undefined) updatedData.price = parseFloat(price);
    if (cost !== undefined) updatedData.cost = parseFloat(cost);
    if (totalStock !== undefined) updatedData.totalStock = parseInt(totalStock);
    if (mainWarehouse) updatedData.mainWarehouse = new mongoose.Types.ObjectId(mainWarehouse);
    if (supplier_id !== undefined) {
      updatedData.supplier_id = supplier_id ? new mongoose.Types.ObjectId(supplier_id) : null;
    }
    if (status) updatedData.status = status;

    const product = await CentralizedProduct.findByIdAndUpdate(id, updatedData, { new: true });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Update CentralizedProduct error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// SOFT DELETE PRODUCT
// ================================
const deleteCentralizedProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await CentralizedProduct.findByIdAndUpdate(id, { deleted: true }, { new: true });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully", product });
  } catch (error) {
    console.error("Delete CentralizedProduct error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// ADJUST STOCK
// ================================
const adjustCentralizedProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, action } = req.body; // delta can be positive or negative

    if (typeof delta !== "number") return res.status(400).json({ message: "Delta must be a number" });

    const product = await CentralizedProduct.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.totalStock += delta;

    // Add to history
    product.history.push({
      action: action || "adjust",
      quantity: delta,
      user: req.user._id,
    });

    await product.save();

    res.status(200).json({ message: "Stock adjusted successfully", product });
  } catch (error) {
    console.error("Adjust CentralizedProduct stock error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateCentralizedProductPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, cost } = req.body;

    if (price === undefined && cost === undefined) {
      return res.status(400).json({ message: "Price or cost is required" });
    }

    const product = await CentralizedProduct.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const nextPrice = price !== undefined ? parseFloat(price) : product.price;
    const nextCost = cost !== undefined ? parseFloat(cost) : product.cost;

    const priceChanged = price !== undefined && product.price !== nextPrice;
    const costChanged = cost !== undefined && product.cost !== nextCost;

    if (!priceChanged && !costChanged) {
      return res.status(200).json({ message: "No price/cost changes detected", product });
    }

    const historyParts = [];
    if (priceChanged) historyParts.push(`price ${product.price} -> ${nextPrice}`);
    if (costChanged) historyParts.push(`cost ${product.cost} -> ${nextCost}`);

    product.history.push({
      action: "price_cost_updated",
      quantity: 0,
      user: req.user._id,
      note: historyParts.join(", "),
      date: new Date(),
    });

    if (priceChanged) product.price = nextPrice;
    if (costChanged) product.cost = nextCost;
    await product.save();

    res.status(200).json({ message: "Price/cost updated successfully", product });
  } catch (error) {
    console.error("Price update error:", error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createCentralizedProduct,
  getCentralizedProducts,
  getCentralizedProductById,
  updateCentralizedProduct,
  deleteCentralizedProduct,
    adjustCentralizedProductStock,
  updateCentralizedProductPrice,
};