// backend/controllers/jobCard.controller.js
const JobCard = require('../models/jobCard.model');
const mongoose = require('mongoose');
const User = require('../models/user.model');
// Create a new Job Card
const createJobCard = async (req, res) => {
  try {
  
    
    const {
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      technicianId,
      technicianName,
      status,
      services,
      parts,
      notes,
      branchId,  // ← Frontend sends branchId (camelCase)
    } = req.body;

    // Determine branch ID based on user role
    let branch_id;
    const isAdmin = req.user?.role === 'admin';
   
    
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (isAdmin) {
      // Admin can specify branch ID from request body
      branch_id = branchId || req.body.branch_id;
      if (!branch_id) {
        return res.status(400).json({ message: 'Branch ID is required for admin users' });
      }
    } else {
      // Non-admin, non-manager users use their assigned branch ID
      branch_id = req.user.branch_id;
      if (!branch_id) {
        return res.status(403).json({ message: 'User does not have an assigned branch' });
      }
    }

      

    // Generate job number
    const lastJob = await JobCard.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastJob && lastJob.jobNumber) {
      const match = lastJob.jobNumber.match(/JOB-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const jobNumber = `JOB-${String(nextNumber).padStart(4, '0')}`;

    const jobCard = new JobCard({
      jobNumber,
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      branchId: branch_id,  // ← Use branchId to match schema (camelCase)
      technicianId,
      technicianName,
      status: status || 'pending',
      services: services || [],
      parts: parts || [],
      notes: notes || '',
    });

    await jobCard.save();
    res.status(201).json({ message: 'Job Card created', jobCard });
  } catch (error) {
    console.error("Create job card error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getJobCards = async (req, res) => {
  try {
    let query = { deleted: false };
    
    
    
    const isAdmin = req.user.role === 'admin';
    
    // Admin sees all job cards
    if (isAdmin) {
      // No filter - get all job cards
    } 
    // Non-admin users see only their branch's job cards
    else {
      if (!req.user.branch_id) {
        return res.status(403).json({ message: 'User does not have an assigned branch' });
      }
      // ✅ FIXED: Use 'branchId' instead of 'branch_id' to match schema
      query.branchId = req.user.branch_id;
    }
    
    const jobCards = await JobCard.find(query)
      .populate('branchId', 'branch_name')
      .populate('technicianId', 'firstName lastName email')
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'make model year plateNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ jobCards });
  } catch (error) {
    console.error(error);
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