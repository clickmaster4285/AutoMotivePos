// controllers/supplierController.js
const Supplier = require('../models/supplier.model');
const Branch = require('../models/branch.model');

function buildSupplierId() {
    return `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}



const createSupplier = async (req, res) => {
  

    try {
        const payload = { ...req.body };
        const { role, branch_id: userBranchId } = req.user;
        const isAdmin = String(role || '').toLowerCase() === 'admin';

        if (isAdmin) {
            const branchId = payload.branch_id;
            if (!branchId) {
                return res.status(400).json({ message: 'branch_id is required' });
            }
            const branchExists = await Branch.findById(branchId);
            if (!branchExists) {
                return res.status(400).json({ message: 'Invalid branch_id' });
            }
            payload.branch_id = branchId;
        } else {
            if (!userBranchId) {
                return res.status(400).json({ message: 'User branch is not set; cannot assign supplier' });
            }
            payload.branch_id = userBranchId;
        }

        // ✅ Auto supplier ID
        if (!payload.supplier_id) {
            payload.supplier_id = buildSupplierId();
        }

        // ✅ Fallback company name
        if (!payload.company_name && payload.name) {
            payload.company_name = payload.name;
        }

        if (!payload.company_name) {
            return res.status(400).json({ message: "Company name is required" });
        }

        const supplier = new Supplier(payload);
        await supplier.save();

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier
        });

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Duplicate supplier ID"
            });
        }

        res.status(400).json({
            message: 'Error creating supplier',
            error: error.message
        });
    }
};


// 2️⃣ Get all suppliers
const getAllSuppliers = async (req, res) => {
    try {
        const { role, branch_id } = req.user;
        const isAdmin = String(role || '').toLowerCase() === 'admin';
        const filter = { is_active: true };
        if (!isAdmin && branch_id) {
            filter.branch_id = branch_id;
        }
        const suppliers = await Supplier.find(filter);
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
        const { role, branch_id } = req.user;
        const isAdmin = String(role || '').toLowerCase() === 'admin';
        if (!isAdmin && branch_id && String(supplier.branch_id) !== String(branch_id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.status(200).json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching supplier', error: error.message });
    }
};

// 4️⃣ Update supplier by ID
const updateSupplier = async (req, res) => {
    try {
        const existing = await Supplier.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Supplier not found' });
        const { role, branch_id } = req.user;
        const isAdmin = String(role || '').toLowerCase() === 'admin';
        if (!isAdmin && branch_id && String(existing.branch_id) !== String(branch_id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
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
        const { role, branch_id } = req.user;
        const isAdmin = String(role || '').toLowerCase() === 'admin';
        if (!isAdmin && branch_id && String(supplier.branch_id) !== String(branch_id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

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
