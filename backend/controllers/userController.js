const mongoose = require('mongoose');
const User = require('../models/user.model');
const Branch = require('../models/branch.model');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { PERMISSIONS } = require('../config/permissions');

const createUser = async (req, res, next) => {
  console.log("req.user", req.body);

  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      email, 
      password, 
      pin,
      hasSystemAccess = false,
      isTwoFactorEnabled = false,
      role = 'general_staff', 
      permissions = [], 
      branch_id,
      employment = {},
      shift,
      salary,
      address,
      emergencyContact
    } = req.body;

    // Base validation
    if (!firstName) {
      return res.status(400).json({ message: 'First name is required' });
    }

    // Conditional validation for system access
    if (hasSystemAccess) {
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required for system access' });
      }
    }

    // Branch validation
    if (branch_id) {
      if (!mongoose.Types.ObjectId.isValid(branch_id)) {
        return res.status(400).json({ message: 'Invalid branch ID format' });
      }

      const branchExists = await Branch.findOne({ 
        _id: branch_id, 
        status: 'ACTIVE' 
      });

      if (!branchExists) {
        return res.status(400).json({ message: 'Branch not found or is inactive' });
      }
    }

    // Email uniqueness check
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        isDeleted: false 
      });

      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
    }

    const userId = generateUserId({ firstName, lastName, role });

    // Hash password
    const hashedPassword = password 
      ? await hashPassword(password) 
      : undefined;

    const userData = {
      userId,
      firstName,
      lastName,
      email: email || undefined,
      phone,
      hasSystemAccess,
      password: hashedPassword,
      isTwoFactorEnabled,
      role,
      permissions: hasSystemAccess ? permissions : [],
      branch_id,

      // ✅ Employment (FIXED)
      employment: {
        hireDate: employment.hireDate || Date.now(),
        designation: employment.designation,
        department: employment.department,
        status: employment.status || 'ACTIVE',
      },

      shift,
      salary,
      address,
      emergencyContact,

      // Histories
      salaryHistory: salary
        ? [{ ...salary, updatedBy: req.user?._id }]
        : [],

      designationHistory: (employment.designation || employment.department)
        ? [{
            designation: employment.designation,
            department: employment.department,
            updatedBy: req.user?._id
          }]
        : [],

      shiftHistory: shift
        ? [{ ...shift, updatedBy: req.user?._id }]
        : []
    };

    const user = await User.create(userData);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.pin;

    res.status(201).json(userResponse);

  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ isDeleted: false, role: { $ne: 'admin' } })
        .populate('branch_id', 'branch_name')
        .populate('deletedBy', 'firstName lastName')
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments({ isDeleted: false, role: { $ne: 'admin' } })
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      users
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false })
      .populate('branch_id', 'branch_name')
      .populate('deletedBy', 'firstName lastName')
      .select('-password');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { userId, ...updateFields } = req.body;

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ---------------- SECURITY ----------------

    if (req.user.role !== 'admin' && targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Forbidden: Cannot edit admin.' });
    }

    if (updateFields.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admin can assign admin role.' });
    }

    // ---------------- REMOVE EMPTY EMAIL (IMPORTANT FIX) ----------------
    if (updateFields.email === "") {
      delete updateFields.email;
    }

    // If system access disabled → remove credentials
    if (updateFields.hasSystemAccess === false) {
      delete updateFields.email;
      delete updateFields.password;
      updateFields.permissions = [];
    }

    // ---------------- HISTORY LOGIC ----------------

    // 1️⃣ Salary Change Detection
    if (
      updateFields.salary &&
      (
        updateFields.salary.baseAmount !== targetUser.salary?.baseAmount ||
        updateFields.salary.payType !== targetUser.salary?.payType
      )
    ) {
      updateFields.$push = updateFields.$push || {};
      updateFields.$push.salaryHistory = {
        baseAmount: targetUser.salary?.baseAmount,
        payType: targetUser.salary?.payType,
        effectiveDate: new Date(),
        updatedBy: req.user._id
      };
    }

    // 2️⃣ Designation / Department Change
    if (
      updateFields.employment &&
      (
        updateFields.employment.designation !== targetUser.employment?.designation ||
        updateFields.employment.department !== targetUser.employment?.department
      )
    ) {
      updateFields.$push = updateFields.$push || {};
      updateFields.$push.designationHistory = {
        designation: targetUser.employment?.designation,
        department: targetUser.employment?.department,
        effectiveDate: new Date(),
        updatedBy: req.user._id
      };
    }

    // 3️⃣ Shift Change Detection
    if (
      updateFields.shift &&
      (
        updateFields.shift.startTime !== targetUser.shift?.startTime ||
        updateFields.shift.endTime !== targetUser.shift?.endTime
      )
    ) {
      updateFields.$push = updateFields.$push || {};
      updateFields.$push.shiftHistory = {
        startTime: targetUser.shift?.startTime,
        endTime: targetUser.shift?.endTime,
        workDays: targetUser.shift?.workDays,
        effectiveDate: new Date(),
        updatedBy: req.user._id
      };
    }

    // ---------------- HASH PASSWORD IF UPDATED ----------------

    if (updateFields.password) {
      updateFields.password = await hashPassword(updateFields.password);
    }

    // ---------------- BRANCH VALIDATION ----------------

    if (updateFields.branch_id) {
      if (!mongoose.Types.ObjectId.isValid(updateFields.branch_id)) {
        return res.status(400).json({ message: 'Invalid branch ID' });
      }

      const branchExists = await Branch.findOne({
        _id: updateFields.branch_id,
        status: 'ACTIVE'
      });

      if (!branchExists) {
        return res.status(400).json({ message: 'Invalid branch' });
      }
    }

    // ---------------- UPDATE ----------------

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateFields,
      { new: true, runValidators: true }
    ).select('-password -pin');

    res.status(200).json(user);

  } catch (error) {
    next(error);
  }
};
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        isActive: false,
      },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getPermissions = (req, res, next) => {
  try {
    const allModulesStructured = PERMISSIONS.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = { moduleName: perm.module, permissions: [] };
      }
      acc[perm.module].permissions.push(perm.id);
      return acc;
    }, {});
    res.status(200).json(Object.values(allModulesStructured));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPermissions,
};
