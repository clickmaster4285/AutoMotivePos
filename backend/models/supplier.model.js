const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    supplier_id: { type: String, required: true, unique: true },
    company_name: { type: String, required: true },
    contact_person: String,
    phone: String,
    email: { type: String, lowercase: true },
    address: String,
    tax_id: String,
    registration_number: String,
    is_active: { type: Boolean, default: true },

    banking: {
        bank_name: String,
        account_number: String,
        account_holder_name: String,
        payment_terms: { type: String, enum: ['Net 30', 'Net 60', 'Immediate'], default: 'Net 30' },
        credit_limit: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
    },

    performance: {
        total_orders: { type: Number, default: 0 },
        completed_orders: { type: Number, default: 0 },
        on_time_delivery_rate: { type: Number, default: 0 },
        quality_rating: { type: Number, min: 0, max: 5, default: 0 }
    },

}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
