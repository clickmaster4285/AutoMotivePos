const Product = require("../models/product.model");
const CentralizedProduct = require("../models/centralizedProducts.model");

const createProduct = async (req, res) => {
  try {
    const {
      centralizedProductId,
      stock,
      minStock,
      warehouse_id,
      branch_id,
     
      name,
      sku,
      category,
      price,
      cost,
    } = req.body;


if (req.user.role !== "admin") {
  branch_id = req.user.branch_id; 
}
    let resolved = { name, sku, category, price, cost };
    let centralized = null;

    if (centralizedProductId) {
      centralized = await CentralizedProduct.findById(centralizedProductId);
      if (!centralized) return res.status(404).json({ message: "Centralized product not found" });

      resolved = {
        name: centralized.name,
        sku: centralized.sku,
        category: centralized.category,
        price: centralized.price,
        cost: centralized.cost,
      };

      const qty = parseInt(stock) || 0;
      if (qty > 0) {
        if ((centralized.totalStock || 0) < qty) {
          return res.status(400).json({ message: "Not enough centralized stock available" });
        }
        centralized.totalStock -= qty;
        centralized.history = centralized.history || [];
        centralized.history.push({
          action: "allocated_to_branch",
          quantity: -qty,
          user: req.user?._id,
          date: new Date(),
        });
        await centralized.save();
      }
    }

    if (!resolved?.name || !resolved?.sku || !resolved?.category) {
      return res.status(400).json({ message: "name, sku, and category are required (or select a centralized product)" });
    }

    const qty = parseInt(stock) || 0;
    const existingProduct = await Product.findOne({
      sku: resolved.sku,
      branch_id,
      warehouse_id,
      deleted: { $ne: true },
    });

    // If same product already exists at same branch+warehouse, merge by increasing stock.
    if (existingProduct) {
      const oldStock = Number(existingProduct.stock || 0);
      existingProduct.stock = oldStock + qty;
      if (minStock !== undefined && minStock !== null) {
        existingProduct.minStock = minStock;
      }
      existingProduct.history = existingProduct.history || [];
      existingProduct.history.push({
        action: "stock_added",
        quantity: qty,
        oldStock,
        newStock: existingProduct.stock,
        date: new Date(),
        user: req.user?._id,
      });
      await existingProduct.save();
      return res.status(200).json({ message: "Product already exists. Stock added to existing record", product: existingProduct });
    }

    const product = new Product({
      name: resolved.name,
      sku: resolved.sku,
      category: resolved.category,
      price: resolved.price,
      cost: resolved.cost,
      stock: qty,
      minStock,
      warehouse_id,
      branch_id,
      centralizedProduct: centralized ? centralized._id : null,
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
      .populate("centralizedProduct", "name sku totalStock status")
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
      .populate("category", "categoryName")
      .populate("centralizedProduct", "name sku totalStock status");

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
    const { role, branch_id, _id: userId } = req.user; // get userId
    const isAdmin = String(role || "").toLowerCase() === "admin";

    let filter = { _id: id };
    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    // Find the product first
    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If stock is updated via PUT, keep centralized totals consistent.
    // - Increasing branch stock consumes centralized stock.
    // - Decreasing branch stock returns to centralized stock.
    if (req.body && req.body.stock !== undefined && req.body.stock !== null) {
      const nextStock = Number(req.body.stock);
      if (Number.isNaN(nextStock)) return res.status(400).json({ message: "stock must be a number" });
      if (nextStock < 0) return res.status(400).json({ message: "Stock cannot be negative" });

      const oldStock = Number(product.stock || 0);
      const delta = nextStock - oldStock;

      if (delta !== 0 && product.centralizedProduct) {
        const centralized = await CentralizedProduct.findById(product.centralizedProduct);
        if (!centralized) return res.status(400).json({ message: "Linked centralized product not found" });

        if (delta > 0) {
          if ((centralized.totalStock || 0) < delta) {
            return res.status(400).json({ message: "Not enough centralized stock available" });
          }
          centralized.totalStock -= delta;
          centralized.history = centralized.history || [];
          centralized.history.push({
            action: "allocated_to_branch",
            quantity: -delta,
            user: userId,
            date: new Date(),
          });
        } else {
          centralized.totalStock += Math.abs(delta);
          centralized.history = centralized.history || [];
          centralized.history.push({
            action: "returned_from_branch",
            quantity: Math.abs(delta),
            user: userId,
            date: new Date(),
          });
        }

        await centralized.save();
      }
    }

    // Update the product
    Object.assign(product, req.body);

    // Add history entry
    product.history = product.history || [];
    product.history.push({
      action: "updated",
      changes: req.body, // optional: just store what was changed
      date: new Date(),
      user: userId,
    });

    await product.save();

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
    const { role, branch_id, _id: userId } = req.user; // get userId
    const isAdmin = String(role || "").toLowerCase() === "admin";

    let filter = { _id: id };
    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const oldStock = product.stock;
    const delta = Number(quantity);
    if (Number.isNaN(delta)) return res.status(400).json({ message: "quantity must be a number" });

    // If linked to centralized product, keep totals consistent:
    // - Adding stock to branch consumes centralized stock (delta > 0 => centralized -= delta)
    // - Removing stock from branch returns to centralized stock (delta < 0 => centralized += abs(delta))
    if (product.centralizedProduct) {
      const centralized = await CentralizedProduct.findById(product.centralizedProduct);
      if (!centralized) return res.status(400).json({ message: "Linked centralized product not found" });

      if (delta > 0) {
        if ((centralized.totalStock || 0) < delta) {
          return res.status(400).json({ message: "Not enough centralized stock available" });
        }
        centralized.totalStock -= delta;
        centralized.history = centralized.history || [];
        centralized.history.push({
          action: "allocated_to_branch",
          quantity: -delta,
          user: userId,
          date: new Date(),
        });
      } else if (delta < 0) {
        centralized.totalStock += Math.abs(delta);
        centralized.history = centralized.history || [];
        centralized.history.push({
          action: "returned_from_branch",
          quantity: Math.abs(delta),
          user: userId,
          date: new Date(),
        });
      }
      await centralized.save();
    }

    product.stock += delta;

    if (product.stock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    // Add history entry
    product.history = product.history || [];
    product.history.push({
      action: delta >= 0 ? "stock_added" : "stock_removed",
      quantity: delta,
      oldStock,
      newStock: product.stock,
      date: new Date(),
      user: userId,
    });

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