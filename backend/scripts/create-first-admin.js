// scripts/create-first-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model (make sure path is correct)
const User = require('../models/User');

const createFirstAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      process.exit(0);
    }

    // Admin user details
    const adminData = {
      name: 'Jack',
      email: 'jack@apict.com',
      password: 'Mnyandu2000',
      phone: '+7234567890',
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved',
      isSuspended: false
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    adminData.password = hashedPassword;

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('=================================');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Role:', adminData.role);
    console.log('=================================');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
    console.log('\nYou can now login to the admin dashboard at:');
    console.log('http://localhost:3000/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
};

// Run the function
createFirstAdmin();