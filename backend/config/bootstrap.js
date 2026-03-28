const mongoose = require('mongoose');
const User = require('../models/user.model');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');
const { PERMISSIONS } = require('./permissions'); 
const Settings = require('../models/settings.model');

const initializeAdminAccount = async () => {
  const {
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_ROLE = 'admin',
    COMPANY_NAME = 'My Company'
  } = process.env;

  if (!ADMIN_FIRST_NAME || !ADMIN_LAST_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Missing required environment variables for default admin creation.');
    console.error('Please set ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD.');
    process.exit(1);
  }

  try {

    const allPermissions = PERMISSIONS.map(p => p.id);

    let adminUser = await User.findOne({
      role: ADMIN_ROLE,
      isDeleted: false,
    });

    // ✅ If Admin Exists → Update Permissions Only
    if (adminUser) {
      console.log('✅ Admin user already exists.');

      const existingPermissionsSet = new Set(adminUser.permissions);
      const permissionsToAdd = allPermissions.filter(
        p => !existingPermissionsSet.has(p)
      );

      if (permissionsToAdd.length > 0) {
        adminUser.permissions = [
          ...adminUser.permissions,
          ...permissionsToAdd
        ];
        await adminUser.save();
        console.log(
          `✅ Updated admin user with new permissions: ${permissionsToAdd.join(', ')}`
        );
      } else {
        console.log('Admin user permissions are already up to date.');
      }

    } 
    // ✅ If Admin Does NOT Exist → Create Admin
    else {

      console.log('No admin user found. Creating default admin...');

      const hashedPassword = await hashPassword(ADMIN_PASSWORD);

      const userId = generateUserId({
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: ADMIN_ROLE,
      });

      adminUser = new User({
        userId,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: ADMIN_ROLE,
        permissions: allPermissions,
        isActive: true,
        hasSystemAccess: true,
      });

      await adminUser.save();

      console.log('✅ Default admin user created successfully.');
    }

    // ✅ ALWAYS Ensure Settings Exist
    const existingSettings = await Settings.findOne();

    if (!existingSettings) {
      await Settings.create({
        companyName: COMPANY_NAME // required field
      });

      console.log('✅ Default settings initialized.');
    } else {
      console.log('Settings already initialized.');
    }

  } catch (error) {
    console.error('❌ Error during system initialization:', error.message);
    process.exit(1);
  }
};

module.exports = { initializeAdminAccount };
