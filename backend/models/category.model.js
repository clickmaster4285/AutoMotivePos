const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  categoryCode: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    enum: [
      "all",
  "Mechanical",
  "Electrical",
  "Paint",
  "Service",
  "Tires",
  "AC",
  "Diagnostics",
  "Detailing"
],
    required: true
  },
status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);