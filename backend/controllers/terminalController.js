const Terminal = require("../models/terminal.model");
const User = require("../models/user.model");
const Supplier = require('../models/supplier.model');
const mongoose = require("mongoose");
const Branch = require('../models/branch.model');

exports.createTerminal = async (req, res) => {
  try {
    const { terminalId, terminalName, branch, location } = req.body;

     const user = req.user;
    let finalBranchId;

    // ✅ ROLE BASED BRANCH ASSIGNMENT
    if (user.role === "admin") {
      if (!branch) {
        return res.status(400).json({ error: "Branch is required for admin" });
      }
      finalBranchId = branch;
    } else {
      finalBranchId = user.branch_id;
    }


    

    const existing = await Terminal.findOne({ terminalId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Terminal already exists" });
    }

    const terminal = new Terminal({
      terminalId,
      terminalName,
      branch,
      location,
      users: [],
      actions: [],
    });

    await terminal.save();
    res.status(201).json({ success: true, data: terminal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Add user to terminal ───────────────────────────────
exports.addUserToTerminal = async (req, res) => {
  try {
   
    const { id } = req.params; 
    let { userId, role } = req.body;

    if (!['employee', 'supplier'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

   
    const terminal = await Terminal.findById(id);
    
    if (!terminal) {
      console.log("Terminal not found with _id:", id);
      return res.status(404).json({ success: false, message: "Terminal not found" });
    }

    console.log("User Already exists:", terminal.terminalName, terminal._id);

    
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
  const userExists = terminal.users.some(u =>
  new mongoose.Types.ObjectId(u.userId).equals(userIdObj)
);

if (userExists) {
  return res.status(400).json({
    success: false,
    message: "User already exists in this terminal"
  });
}

    
    if (role === "employee") {
      const user = await mongoose.model("User").findById(userIdObj);
      if (!user) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
   
    } else if (role === "supplier") {
      const supplier = await mongoose.model("Supplier").findById(userIdObj);
      if (!supplier) {
        return res.status(404).json({ success: false, message: "Supplier not found" });
      }
      
    }

    const roleRef = role === "employee" ? "User" : "Supplier";

    // Add the user to the terminal
    terminal.users.push({ 
      userId: userIdObj, 
      role, 
      roleRef 
    });

    
    
    // Mark the users array as modified (helps with nested arrays)
    terminal.markModified('users');
    
    // Save the terminal
    const savedTerminal = await terminal.save();
   

    // Populate the user details
    const populatedTerminal = await Terminal.findById(id)
      .populate({
        path: 'users.userId',
        select: role === "employee" ? 'firstName lastName email' : 'company_name email supplier_id',
        refPath: 'users.roleRef'
      });

    res.status(200).json({ success: true, data: populatedTerminal });
  } catch (err) {
    console.error("Error in addUserToTerminal:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Remove user from terminal ──────────────────────────
exports.removeUserFromTerminal = async (req, res) => {
  try {
    const { id, userId } = req.params;

    console.log("Removing user from terminal with id:", id, "and userId:", userId);

    const terminal = await Terminal.findById(id);
    if (!terminal) {
      return res.status(404).json({ success: false, message: "Terminal not found" });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    terminal.users = terminal.users.filter(
      u => !u.userId.equals(userIdObj)
    );

    terminal.markModified('users'); // important for nested array
    await terminal.save();

    res.status(200).json({ success: true, data: terminal });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Record an action ───────────────────────────────────
exports.recordAction = async (req, res) => {
  try {
    const { terminalId } = req.params;
    const { userId, role, actionType, description, metadata } = req.body;

    const terminal = await Terminal.findOne({ terminalId });
    if (!terminal) return res.status(404).json({ success: false, message: "Terminal not found" });

    const roleRef = role === "employee" ? "User" : "Supplier";

    terminal.actions.push({
      userId,
      role,
      roleRef,
      actionType,
      description,
      metadata,
    });

    await terminal.save();
    res.status(200).json({ success: true, data: terminal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ─── Get terminal info with users and history ──────────
// exports.getTerminal = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const terminal = await Terminal.findOne({ _id: id })
//       .populate("users.userId", "firstName lastName role")
//       .populate("actions.userId", "firstName lastName role");

//     if (!terminal) return res.status(404).json({ success: false, message: "Terminal not found" });

//     res.status(200).json({ success: true, data: terminal });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


exports.getTerminal = async (req, res) => {
  try {
    const { id } = req.params;

    const terminal = await Terminal.findOne({ _id: id })
      .populate({
        path: 'users.userId',
        select: 'firstName lastName email company_name supplier_id role', // Include both user and supplier fields
        refPath: 'users.roleRef' // This dynamically references either "User" or "Supplier" model
      })
      .populate({
        path: 'actions.userId',
        select: 'firstName lastName email company_name supplier_id role',
        refPath: 'actions.roleRef' // This dynamically references either "User" or "Supplier" model
      })
      .populate('branch', 'branch_name location address'); // Populate branch with specific fields

    if (!terminal) return res.status(404).json({ success: false, message: "Terminal not found" });

    res.status(200).json({ success: true, data: terminal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── List all terminals ────────────────────────────────
// ─── List all terminals ────────────────────────────────
exports.listTerminals = async (req, res) => {
  try {
    const terminals = await Terminal.find()
      .populate({
        path: 'users.userId',
        select: 'firstName lastName email company_name supplier_id', // Include both user and supplier fields
        refPath: 'users.roleRef' // Dynamically references either "User" or "Supplier" model
      })
      .populate({
        path: 'actions.userId',
        select: 'firstName lastName email company_name supplier_id',
        refPath: 'actions.roleRef' // Dynamically references either "User" or "Supplier" model
      })
      .populate("branch", "branch_name location address");

    res.status(200).json({ success: true, data: terminals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};



exports.updateTerminal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid terminal ID",
      });
    }

    const {
      terminalName,
      branch,
      location,
      addUsers = [],
      removeUsers = [],
      isActive,
    } = req.body;

    const terminal = await Terminal.findById(id);

    if (!terminal) {
      return res.status(404).json({
        success: false,
        message: "Terminal not found",
      });
    }

    // ─────────────────────────────────────
    // BASIC FIELD UPDATES
    // ─────────────────────────────────────
    if (terminalName !== undefined) terminal.terminalName = terminalName;
    if (branch !== undefined) terminal.branch = branch;
    if (location !== undefined) terminal.location = location;
    if (isActive !== undefined) terminal.isActive = isActive;

    // ─────────────────────────────────────
    // REMOVE USERS
    // ─────────────────────────────────────
    if (removeUsers.length > 0) {
      terminal.users = terminal.users.filter(
        (u) => !removeUsers.includes(u.userId.toString())
      );

      removeUsers.forEach((userId) => {
        terminal.actions.push({
          userId,
          role: "employee", // optional, adjust if needed
          roleRef: "User",
          actionType: "REMOVE_USER",
          description: `User removed from terminal`,
        });
      });
    }

    // ─────────────────────────────────────
    // ADD USERS
    // Expected format:
    // addUsers: [
    //   { userId, role: "employee", roleRef: "User" }
    // ]
    // ─────────────────────────────────────
    if (addUsers.length > 0) {
      for (const user of addUsers) {
        const exists = terminal.users.find(
          (u) => u.userId.toString() === user.userId
        );

        if (!exists) {
          terminal.users.push({
            userId: user.userId,
            role: user.role,
            roleRef: user.roleRef,
          });

          terminal.actions.push({
            userId: user.userId,
            role: user.role,
            roleRef: user.roleRef,
            actionType: "ADD_USER",
            description: `User assigned to terminal`,
          });
        }
      }
    }

    await terminal.save();

    const updatedTerminal = await Terminal.findById(id)
      .populate("users.userId")
      .populate("actions.userId");

    res.status(200).json({
      success: true,
      message: "Terminal updated successfully",
      data: updatedTerminal,
    });
  } catch (error) {
    console.error("Update Terminal Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.updateTerminalDetails = async (req, res) => {
  try {
    const { id } = req.params;
console.log("req.bofy", req.body)
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid terminal ID" });
    }

    const { terminalName, branch, location, isActive } = req.body;

    const terminal = await Terminal.findById(id);
    if (!terminal) {
      return res.status(404).json({ success: false, message: "Terminal not found" });
    }

    // Update basic details
    if (terminalName !== undefined) terminal.terminalName = terminalName;
    if (branch !== undefined) terminal.branch = branch;
    if (location !== undefined) terminal.location = location;

    // Deactivate or activate terminal
    if (isActive !== undefined) terminal.isActive = isActive;

    await terminal.save();

    res.status(200).json({
      success: true,
      message: `Terminal ${isActive === false ? "deactivated" : "updated"} successfully`,
      data: terminal,
    });
  } catch (error) {
    console.error("Update Terminal Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};