// controllers/settings.controller.js
const Settings = require("../models/settings.model");
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');


exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: null,
        logo: null,
        tax: null,
        currency: null,
        language: null,
        timezone: null,
        notifications: {
          emailNotifications: null,
          smsNotifications: null,
          salesAlerts: null,
          inventoryAlerts: null,
          systemUpdates: null,
          dailyReports: null,
          weeklyReports: null,
        },
      });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: null,
        logo: null,
        tax: null,
        currency: null,
        language: null,
        timezone: null,
        phone: null,
        address: null,
        notifications: {
          emailNotifications: null,
          smsNotifications: null,
          salesAlerts: null,
          inventoryAlerts: null,
          systemUpdates: null,
          dailyReports: null,
          weeklyReports: null,
        },
      });
    }

    const data = { ...req.body };

    // ✅ If logo file uploaded, save its path
    if (req.file) {
      data.logo = `/uploads/${req.file.filename}`;
    }

    const updated = await Settings.findByIdAndUpdate(settings._id, data, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateProfile = async (req, res) => {
  try {
  

    // 🔹 Use MongoDB ObjectId from authenticated user
    const userId = req.user._id;

    const { firstName, lastName, phone, email, currentPassword, oldPassword, newPassword } = req.body;

    // Fetch user including password
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update names freely
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Check if email or phone is changing
    const wantsToChangeEmail = email && email !== user.email;
    const wantsToChangePhone = phone && phone !== user.phone;

    if (wantsToChangeEmail || wantsToChangePhone) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Password required to change email or phone" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid password" });

      if (wantsToChangeEmail) user.email = email;
      if (wantsToChangePhone) user.phone = phone;
    }

    // Password change
    if (newPassword) {
      if (!oldPassword) return res.status(400).json({ message: "Old password required to change password" });

      const isOldMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isOldMatch) return res.status(401).json({ message: "Old password does not match" });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: "Profile updated successfully", user: userResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
