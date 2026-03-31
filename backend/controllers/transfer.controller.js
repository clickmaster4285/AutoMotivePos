const mongoose = require("mongoose");
const StockTransfer = require("../models/transfer.model");


const createStockTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      product_id,
      to_branch_id,
      to_warehouse_id,
      quantity,
    } = req.body;

    const { branch_id, role, _id, user_Name } = req.user;

    // 🔒 Get product (respect role)
    const product = await Product.findOne({
      _id: product_id,
      ...(role !== "ADMIN" && { branch_id }),
    }).session(session);

    if (!product) throw new Error("Product not found");

    if (quantity > product.stock) {
      throw new Error("Insufficient stock");
    }

    // Deduct stock
    product.stock -= quantity;
    await product.save({ session });

    // Add stock to destination
    let targetProduct = await Product.findOne({
      sku: product.sku,
      branch_id: to_branch_id,
      warehouse_id: to_warehouse_id,
    }).session(session);

    if (targetProduct) {
      targetProduct.stock += quantity;
      await targetProduct.save({ session });
    } else {
      targetProduct = await Product.create(
        [
          {
            ...product.toObject(),
            _id: new mongoose.Types.ObjectId(),
            branch_id: to_branch_id,
            warehouse_id: to_warehouse_id,
            stock: quantity,
          },
        ],
        { session }
      );
    }

    // Create transfer record
    await StockTransfer.create(
      [
        {
          product_id: product._id,
          product_name: product.name,

          from_branch_id: product.branch_id,
          from_branch_name: "N/A",

          from_warehouse_id: product.warehouse_id,
          from_warehouse_name: "N/A",

          to_branch_id,
          to_branch_name: "N/A",

          to_warehouse_id,
          to_warehouse_name: "N/A",

          quantity,

          user_id: _id,
          user_name: user_Name,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Transfer successful" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: error.message });
  }
};

const getStockTransfers = async (req, res) => {
  try {
    const { role, branch_id } = req.user;

    let filter = {};

    if (role !== "ADMIN") {
      filter = {
        $or: [
          { from_branch_id: branch_id },
          { to_branch_id: branch_id },
        ],
      };
    }

    const transfers = await StockTransfer.find(filter).sort({
      createdAt: -1,
    });

    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
    createStockTransfer,
    getStockTransfers
};

