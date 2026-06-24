// scripts/create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin user details
    const adminData = {
      name: 'Jack',
      email: 'jack@apict.com',
      password: 'Mnyandu2000',
      phone: '+7234567890',
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminData.email);
      
      // Optionally update password
      const updatePassword = process.argv.includes('--update-password');
      if (updatePassword) {
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log('Admin password updated!');
      }
      
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    adminData.password = hashedPassword;

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

// Run the function
createAdminUser();