// controllers/supplierController.js
const Supplier = require('../models/supplier.model');

// 1️⃣ Create a new supplier
const createSupplier = async (req, res) => {
    
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json({ message: 'Supplier created successfully', supplier });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating supplier', error: error.message });
    }
};

// 2️⃣ Get all suppliers
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({is_active: true});
        res.status(200).json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
    }
};

// 3️⃣ Get single supplier by ID
const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching supplier', error: error.message });
    }
};

// 4️⃣ Update supplier by ID
const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json({ message: 'Supplier updated', supplier });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error updating supplier', error: error.message });
    }
};


// 5️⃣ Soft Delete supplier by ID
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

        // Soft delete: set is_active to false
        supplier.is_active = false;
        await supplier.save();

        res.status(200).json({ message: 'Supplier soft-deleted successfully', supplier });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting supplier', error: error.message });
    }
};


module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
