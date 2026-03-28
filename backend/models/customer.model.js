const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  creditBalance: { type: Number, default: 0 },
  vehicles: [
    {
      id: { type: String, required: true },
      make: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, required: true },
      plateNumber: { type: String, required: true },
      color: { type: String },
    }
  ],
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
}, { timestamps: true });

module.exports = mongoose.model("Customer", CustomerSchema);