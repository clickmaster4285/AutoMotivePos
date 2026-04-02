// backend/controllers/jobCard.controller.js
const JobCard = require('../models/jobCard.model');
const mongoose = require('mongoose');

// Create a new Job Card
const createJobCard = async (req, res) => {
console.log('Hereeee');
  console.log('Creating Job Card with data:', req.body);
  try {
    const {
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      branchId,
      technicianId,
      technicianName,
      status,
      services,
      parts,
      notes,
    } = req.body;

    const jobCard = new JobCard({
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      branchId,
      technicianId,
      technicianName,
      status: status || 'pending',
      services,
      parts,
      notes,
    });

    await jobCard.save();
    res.status(201).json({ message: 'Job Card created', jobCard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


const getJobCards = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;
    // User's own branch (from user document)
    const userBranchId = req.user.branch_id;
    // Optional explicit branch filter from query (?branchId=...)
    const queryBranchId = req.query.branchId;

    let filter = { deleted: false };

    if (role === 'admin') {
      // Admin: all branches by default, or filter by ?branchId if provided
      if (queryBranchId) {
        filter.branchId = queryBranchId;
      }
    } else if (role === 'branch_manager') {
      // Branch manager: restricted to their own branch
      if (!userBranchId) {
        return res.status(400).json({ message: 'Branch not set for user' });
      }
      filter.branchId = userBranchId;
    } else if (role === 'technician') {
      // Technician: only their jobs in their branch
      if (!userBranchId) {
        return res.status(400).json({ message: 'Branch not set for user' });
      }
      filter.branchId = userBranchId;
      filter.technicianId = userId;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobCards = await JobCard.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ jobCards });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single Job Card by ID
const getJobCardById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid ID' });

    const jobCard = await JobCard.findById(id);
    if (!jobCard || jobCard.deleted) return res.status(404).json({ message: 'Job Card not found' });

    res.json({ jobCard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Job Card
const updateJobCard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const jobCard = await JobCard.findOneAndUpdate({ _id: id, deleted: false }, updates, {
      new: true,
    });

    if (!jobCard) return res.status(404).json({ message: 'Job Card not found' });

    res.json({ message: 'Job Card updated', jobCard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete a Job Card
const deleteJobCard = async (req, res) => {
  try {
    const { id } = req.params;

    const jobCard = await JobCard.findOneAndUpdate({ _id: id, deleted: false }, { deleted: true }, { new: true });

    if (!jobCard) return res.status(404).json({ message: 'Job Card not found' });

    res.json({ message: 'Job Card deleted', jobCard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Job Status (for technicians or managers)
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Legacy `delivered` kept in schema for old records, but updates via POS should go to `paid`.
    const allowedStatuses = ['pending', 'in_progress', 'waiting_parts', 'completed', 'paid'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const jobCard = await JobCard.findOneAndUpdate({ _id: id, deleted: false }, { status }, { new: true });

    if (!jobCard) return res.status(404).json({ message: 'Job Card not found' });

    res.json({ message: 'Job status updated', jobCard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createJobCard,
  getJobCards,
  getJobCardById,
  updateJobCard,
  deleteJobCard,
  updateJobStatus,
};