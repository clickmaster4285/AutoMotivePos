// backend/controllers/jobCard.controller.js
const JobCard = require('../models/jobCard.model');
const mongoose = require('mongoose');

// Create a new Job Card
const createJobCard = async (req, res) => {
  console.log('Creating Job Card with data:', req.body);
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
    } = req.body;

    // Determine branch ID based on user role
    let branch_id;
    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager';
    
    if (isAdmin) {
      // Admin can specify branch ID from request body
      branch_id = req.body.branchId || req.body.branch_id;
      if (!branch_id) {
        return res.status(400).json({ message: 'Branch ID is required for admin users' });
      }
    } else if (isManager) {
      // Managers can specify branch ID or use their own
      branch_id = req.body.branchId || req.body.branch_id || req.user.branch_id;
      if (!branch_id) {
        return res.status(403).json({ message: 'No branch ID provided or assigned' });
      }
    } else {
      // Non-admin, non-manager users use their assigned branch ID
      branch_id = req.user.branch_id;
      if (!branch_id) {
        return res.status(403).json({ message: 'User does not have an assigned branch' });
      }
    }

    // Validate that technician belongs to the same branch (if technician is assigned)
    if (technicianId) {
      const technician = await User.findById(technicianId);
      if (!technician) {
        return res.status(404).json({ message: 'Technician not found' });
      }
      
      // Check if technician belongs to the selected branch
      const technicianBranchId = technician.branch_id?._id || technician.branch_id;
      if (technicianBranchId?.toString() !== branch_id.toString()) {
        return res.status(403).json({ 
          message: 'Technician must belong to the selected branch',
          technicianBranch: technicianBranchId,
          jobBranch: branch_id
        });
      }
    }

    const jobCard = new JobCard({
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      branch_id, // Using branch_id to match your schema
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getJobCards = async (req, res) => {
  try {
    let query = { deleted: false };
    
    console.log("User role:", req.user.role);
    console.log("User branch ID:", req.user.branch_id);
    
    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager';
    
    // Admins and Managers can see all job cards
    if (!isAdmin && !isManager) {
      // Non-admin, non-manager users only see jobs from their branch
      if (!req.user.branch_id) {
        return res.status(403).json({ message: 'User does not have an assigned branch' });
      }
      query.branch_id = req.user.branch_id;
      
      // If user is technician, only see their own jobs
      if (req.user.role === 'technician') {
        query.technicianId = req.user._id;
      }
    }
    
    const jobCards = await JobCard.find(query)
                                  .sort({ createdAt: -1 }) // newest first
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