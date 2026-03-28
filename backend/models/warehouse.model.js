const mongoose = require("mongoose");

const WarehouseSchema = new mongoose.Schema({

  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },

  warehouse_name: {
    type: String,
    required: true
  },

  warehouse_type: {
    type: String,
    enum: ["MAIN", "SERVICE_PARTS", "RETURNS", "TRANSIT"],
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
    address_line: String
  }

}, { timestamps: true });

WarehouseSchema.index(
  { tenant_id: 1, branch_id: 1, warehouse_name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Warehouse", WarehouseSchema);