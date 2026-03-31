// backend/models/jobCard.model.js
const mongoose = require('mongoose');

const jobCardSchema = new mongoose.Schema(
  {
    jobNumber: { type: String, required: true, unique: true }, // e.g., "JOB-0001"
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },

    // Customer & Vehicle
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, required: true },
    vehicleName: { type: String, required: true },

    // Technician
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technicianName: { type: String },

    // Job Status
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'delivered'],
      default: 'pending',
    },

    // Services
    services: [
      {
        id: { type: String, required: true }, // uuid
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],

    // Parts
    parts: [
      {
        id: { type: String, required: true }, // uuid
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, default: 1, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
      },
    ],

    notes: { type: String, trim: true },
    deleted: { type: Boolean, default: false }, // soft delete
  },
  { timestamps: true }
);

// Auto-generate job number if not provided
jobCardSchema.pre('validate', async function () {
  if (!this.jobNumber) {
    const count = await mongoose.model('JobCard').countDocuments();
    this.jobNumber = `JOB-${(count + 1).toString().padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('JobCard', jobCardSchema);