const Product = require("../models/product.model");
const CentralizedProduct = require("../models/centralizedProducts.model");

const createProduct = async (req, res) => {
  try {
    let {
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



    // Determine final branch ID
    let finalBranchId = branch_id;
    if (req.user.role !== "admin") {
      finalBranchId = req.user.branch_id;
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
      branch_id: finalBranchId,
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
      branch_id: finalBranchId,
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

    let filter = { deleted: { $ne: true } };

    if (!isAdmin && branch_id) {
      filter.branch_id = branch_id;
    }

    const products = await Product.find(filter)
      .populate("warehouse_id", "name code warehouse_type status location")
      .populate("branch_id", "branch_name")
      .populate("category", "categoryName")
      .populate("centralizedProduct", "name sku totalStock status Brand vehicleCompatibility")
      .sort({ createdAt: -1 });

    // Transform to ensure frontend gets the populated data
    const transformedProducts = products.map(product => {
      const p = product.toObject();
      
      return {
        id: p._id,
        name: p.name,
        sku: p.sku,
        description: p.description,
        categoryId: p.category?._id || p.category,
        categoryName: p.category?.categoryName,
        centralizedProductId: p.centralizedProduct?._id,
        centralizedTotalStock: p.centralizedProduct?.totalStock,
        centralizedProductBrand: p.centralizedProduct?.Brand,
        centralizedProductVehicleCompatibility: p.centralizedProduct?.vehicleCompatibility,
        cost: p.cost,
        price: p.price,
        stock: p.stock,
        minStock: p.minStock,
        status: p.status,
        // Branch data
        branch_id: p.branch_id?._id || p.branch_id,
        branch_name: p.branch_id?.branch_name,
        // Warehouse data - THIS IS THE KEY PART
        warehouse_id: p.warehouse_id?._id || p.warehouse_id,
        warehouse_name: p.warehouse_id?.name,
        warehouse_code: p.warehouse_id?.code,
        warehouse_type: p.warehouse_id?.warehouse_type,
        warehouse_status: p.warehouse_id?.status,
        warehouse_location: p.warehouse_id?.location,
        // Keep full objects if needed
        warehouse: p.warehouse_id,
        branch: p.branch_id,
        category: p.category,
        centralizedProduct: p.centralizedProduct,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    });

    console.log("Sample transformed product:", {
      id: transformedProducts[0]?.id,
      name: transformedProducts[0]?.name,
      warehouse_id: transformedProducts[0]?.warehouse_id,
      warehouse_name: transformedProducts[0]?.warehouse_name,
      warehouse_code: transformedProducts[0]?.warehouse_code
    });

    res.status(200).json({ products: transformedProducts });
  } catch (error) {
    console.error("Error in getProducts:", error);
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
      .populate("warehouse_id", "name")
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
    const { role, branch_id, _id: userId } = req.user;
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

    // Get the update data
    const updateData = { ...req.body };
    
    // Check for duplicate SKU if SKU is being changed
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingDuplicate = await Product.findOne({
        sku: updateData.sku,
        branch_id: updateData.branch_id || product.branch_id,
        warehouse_id: updateData.warehouse_id || product.warehouse_id,
        deleted: { $ne: true },
        _id: { $ne: id } // Exclude current product
      });

      if (existingDuplicate) {
        // MERGE: Add quantity to existing product instead of creating duplicate
        const quantityToAdd = Number(updateData.stock || product.stock || 0);
        
        // Handle centralized stock adjustments
        if (quantityToAdd > 0 && product.centralizedProduct) {
          const centralized = await CentralizedProduct.findById(product.centralizedProduct);
          if (centralized) {
            if ((centralized.totalStock || 0) < quantityToAdd) {
              return res.status(400).json({ message: "Not enough centralized stock available" });
            }
            centralized.totalStock -= quantityToAdd;
            centralized.history = centralized.history || [];
            centralized.history.push({
              action: "merged_to_existing_product",
              quantity: -quantityToAdd,
              user: userId,
              date: new Date(),
            });
            await centralized.save();
          }
        }
        
        // Add quantity to existing product
        existingDuplicate.stock = (existingDuplicate.stock || 0) + quantityToAdd;
        existingDuplicate.history = existingDuplicate.history || [];
        existingDuplicate.history.push({
          action: "merged_from_duplicate",
          quantity: quantityToAdd,
          fromProductId: id,
          oldStock: existingDuplicate.stock - quantityToAdd,
          newStock: existingDuplicate.stock,
          date: new Date(),
          user: userId,
        });
        await existingDuplicate.save();
        
        // Delete the duplicate product
        await Product.findByIdAndUpdate(id, { deleted: true, deletedAt: new Date(), deletedBy: userId });
        
        return res.json({ 
          message: "Product merged with existing product", 
          product: existingDuplicate,
          merged: true,
          originalProductDeleted: id
        });
      }
    }

    // Handle stock updates with centralized inventory
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
    Object.assign(product, updateData);

    // Add history entry
    product.history = product.history || [];
    product.history.push({
      action: "updated",
      changes: req.body,
      date: new Date(),
      user: userId,
    });

    await product.save();

    res.json({ message: "Updated", product });
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      // Try to find and merge with the existing product
      const duplicateKey = error.keyPattern;
      if (duplicateKey.sku && duplicateKey.branch_id && duplicateKey.warehouse_id) {
        const existingProduct = await Product.findOne({
          sku: req.body.sku || (await Product.findById(req.params.id)).sku,
          branch_id: req.body.branch_id || (await Product.findById(req.params.id)).branch_id,
          warehouse_id: req.body.warehouse_id || (await Product.findById(req.params.id)).warehouse_id,
          deleted: { $ne: true }
        });
        
        if (existingProduct && existingProduct._id.toString() !== req.params.id) {
          // Merge logic here
          const productToDelete = await Product.findById(req.params.id);
          const quantityToAdd = Number(productToDelete?.stock || 0);
          
          if (quantityToAdd > 0) {
            existingProduct.stock = (existingProduct.stock || 0) + quantityToAdd;
            await existingProduct.save();
            await Product.findByIdAndUpdate(req.params.id, { deleted: true });
            
            return res.json({ 
              message: "Duplicate prevented. Quantity added to existing product.",
              product: existingProduct
            });
          }
        }
      }
      return res.status(409).json({ 
        message: "Product with same SKU already exists in this branch and warehouse. Use stock adjustment instead.",
        error: "DUPLICATE_PRODUCT"
      });
    }
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