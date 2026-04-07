const mongoose = require("mongoose");

const WarehouseSchema = new mongoose.Schema({
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  warehouse_type: {
    type: String,
    default: "MAIN"
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE"
  },
  location: {
    country: String,
    state: String,
    city: String,
  }
}, { timestamps: true });


WarehouseSchema.index(
  { branch_id: 1, name: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);

module.exports = mongoose.model("Warehouse", WarehouseSchema);