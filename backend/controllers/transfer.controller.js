const StockTransfer = require("../models/transfer.model");
const Product = require("../models/product.model");
const Branch = require("../models/branch.model");
const Warehouse = require("../models/warehouse.model");




// const createStockTransfer = async (req, res) => {
//   console.log("req.body", req.body);

//   try {
//     const {
//       product_id,
//       from_branch_id,
//       from_warehouse_id,
//       to_branch_id,
//       to_warehouse_id,
//       quantity,
//     } = req.body;

//     const { branch_id, role, _id } = req.user;
//     const user_name =
//       [req.user.firstName, req.user.lastName].filter(Boolean).join(" ").trim() ||
//       req.user.email ||
//       req.user.userId ||
//       "Unknown";

//     // 🔒 Get product from source branch and warehouse
//     const product = await Product.findOne({
//       _id: product_id,
//       branch_id: from_branch_id,
//       warehouse_id: from_warehouse_id,
//     });

//     if (!product) {
//       throw new Error("Product not found in source branch/warehouse");
//     }

//     if (quantity > product.stock) {
//       throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
//     }

//     // Get all branch and warehouse details
//     const [fromBranch, fromWarehouse, toBranch, toWarehouse] = await Promise.all([
//       Branch.findById(from_branch_id),
//       Warehouse.findById(from_warehouse_id),
//       Branch.findById(to_branch_id),
//       Warehouse.findById(to_warehouse_id),
//     ]);

//     if (!fromBranch || !fromWarehouse) {
//       throw new Error("Source branch or warehouse not found");
//     }

//     if (!toBranch || !toWarehouse) {
//       throw new Error("Destination branch or warehouse not found");
//     }

//     // Deduct stock from source only
//     product.stock -= quantity;
//     await product.save();

//     // Create transfer record
//     const created = await StockTransfer.create({
//       product_id: product._id,
//       product_name: product.name,

//       from_branch_id: from_branch_id,
//       from_branch_name: fromBranch.branch_name || "N/A",

//       from_warehouse_id: from_warehouse_id,
//       from_warehouse_name: fromWarehouse.name || "N/A",

//       to_branch_id: to_branch_id,
//       to_branch_name: toBranch.branch_name || "N/A",

//       to_warehouse_id: to_warehouse_id,
//       to_warehouse_name: toWarehouse.name || "N/A",

//       quantity: quantity,

//       user_id: _id,
//       user_name,
//     });

//     res.status(201).json({
//       message: "Transfer successful",
//       transfer: created
//     });
    
//   } catch (error) {
//     console.error("Transfer error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };


const createStockTransfer = async (req, res) => {
  console.log("req.body", req.body);

  try {
    const {
      product_id,
      from_branch_id,
      from_warehouse_id,
      to_branch_id,
      to_warehouse_id,
      quantity,
    } = req.body;

    const { branch_id, role, _id } = req.user;
    const user_name =
      [req.user.firstName, req.user.lastName].filter(Boolean).join(" ").trim() ||
      req.user.email ||
      req.user.userId ||
      "Unknown";

    // 🔒 Get product from source branch and warehouse
    const product = await Product.findOne({
      _id: product_id,
      branch_id: from_branch_id,
      warehouse_id: from_warehouse_id,
    });

    if (!product) {
      throw new Error("Product not found in source branch/warehouse");
    }

    if (quantity > product.stock) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    // Get all branch and warehouse details
    const [fromBranch, fromWarehouse, toBranch, toWarehouse] = await Promise.all([
      Branch.findById(from_branch_id),
      Warehouse.findById(from_warehouse_id),
      Branch.findById(to_branch_id),
      Warehouse.findById(to_warehouse_id),
    ]);

    if (!fromBranch || !fromWarehouse) {
      throw new Error("Source branch or warehouse not found");
    }

    if (!toBranch || !toWarehouse) {
      throw new Error("Destination branch or warehouse not found");
    }

    // 1️⃣ Deduct stock from source
    product.stock -= quantity;
    await product.save();

    // 2️⃣ Add stock to destination (create if doesn't exist)
 // 2️⃣ Add stock to destination (create if doesn't exist)
const destProduct = await Product.findOne({
  product_id: product._id,   // Use original product reference instead
  branch_id: to_branch_id,
  warehouse_id: to_warehouse_id,
});

if (destProduct) {
  destProduct.stock += quantity;
  await destProduct.save();
} else {
  // Create a new document for the branch warehouse
  await Product.create({
    product_id: product._id, // reference to main product
    name: product.name,
    sku: product.sku,
    category: product.category,
    cost: product.cost,
    price: product.price,
    stock: quantity,
    branch_id: to_branch_id,
    warehouse_id: to_warehouse_id,
  });
}

    // 3️⃣ Create transfer record
    const created = await StockTransfer.create({
      product_id: product._id,
      product_name: product.name,

      from_branch_id: from_branch_id,
      from_branch_name: fromBranch.branch_name || "N/A",

      from_warehouse_id: from_warehouse_id,
      from_warehouse_name: fromWarehouse.name || "N/A",

      to_branch_id: to_branch_id,
      to_branch_name: toBranch.branch_name || "N/A",

      to_warehouse_id: to_warehouse_id,
      to_warehouse_name: toWarehouse.name || "N/A",

      quantity: quantity,

      user_id: _id,
      user_name,
    });

    res.status(201).json({ 
      message: "Transfer successful", 
      transfer: created 
    });
    
  } catch (error) {
    console.error("Transfer error:", error);
    res.status(500).json({ message: error.message });
  }
};


const getStockTransfers = async (req, res) => {
  try {
    const { role, branch_id } = req.user;

    let filter = {};

    // if (role !== "ADMIN") {
    //   filter = {
    //     $or: [
    //       { from_branch_id: branch_id },
    //       { to_branch_id: branch_id },
    //     ],
    //   };
    // }

    const transfers = await StockTransfer.find(filter).sort({
      createdAt: -1,
    });

    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Incoming transfers for a branch (destination = to_branch_id). */
const getStockTransfersByToBranch = async (req, res) => {
  try {
    const to_branch_id = req.params.toBranchId;
    if (!to_branch_id) {
      return res.status(400).json({ message: "to_branch_id is required" });
    }

    const { role, branch_id } = req.user;
    const isAdmin = String(role || "").toLowerCase() === "admin";

    if (!isAdmin && branch_id && String(to_branch_id) !== String(branch_id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const transfers = await StockTransfer.find({ to_branch_id }).sort({
      createdAt: -1,
    });

    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, branch_id } = req.user;

    let filter = { _id: id };

    if (role !== "ADMIN") {
      filter = {
        _id: id,
        $or: [{ from_branch_id: branch_id }, { to_branch_id: branch_id }],
      };
    }

    const transfer = await StockTransfer.findOne(filter);

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    res.json({ transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStockTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, branch_id } = req.user;

    let filter = { _id: id };

    // Restrict non-admin users
    if (role !== "ADMIN") {
      filter.$or = [
        { from_branch_id: branch_id },
        { to_branch_id: branch_id },
      ];
    }

    const transfer = await StockTransfer.findOneAndUpdate(
      filter,
      { status },
      { returnDocument: "after" }
    );

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    res.json({ message: "Transfer updated", transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStockTransfer,
  getStockTransfers,
  getStockTransfersByToBranch,
  getStockTransferById,
  updateStockTransfer,
};

