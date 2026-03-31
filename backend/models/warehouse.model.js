const mongoose = require("mongoose");

const WarehouseSchema = new mongoose.Schema({

  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
   
  },

  name: {
    type: String,
    required: true
  },
   code: {
    type: String,
    required: true
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
  { tenant_id: 1, branch_id: 1, warehouse_name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Warehouse", WarehouseSchema);