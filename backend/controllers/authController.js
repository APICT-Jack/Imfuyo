const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, businessName, businessAddress } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'buyer',
      businessName,
      businessAddress,
      verificationStatus: 'not_submitted'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitVerification = async (req, res) => {
  try {
    const { faceRecognitionImage, identityDocument, residentCertificate } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.verificationDocuments = {
      faceRecognitionImage,
      identityDocument,
      residentCertificate,
      submittedAt: new Date()
    };
    user.verificationStatus = 'pending';
    // isVerified remains false until admin approves
    
    await user.save();
    
    // Return updated user info
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      canListItems: user.canListItems()
    };
    
    res.json({ 
      message: 'Verification documents submitted successfully. You can now list items with a warning badge.',
      user: updatedUser,
      verificationStatus: user.verificationStatus 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      ...user.toObject(),
      canListItems: user.canListItems()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Add this function to your existing authController.js
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, secretKey } = req.body;
    
    // Check if this is the first admin being created
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    // Secret key for admin registration (store in .env)
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'ImfuyoAdmin2024!';
    
    // Allow registration if:
    // 1. No admins exist (first admin setup), OR
    // 2. User provides correct secret key, OR
    // 3. Current user is already an admin (handled by middleware if you add it)
    if (adminCount > 0 && (!secretKey || secretKey !== ADMIN_SECRET_KEY)) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized. Admin registration requires valid secret key or existing admin privileges.' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const admin = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved',
      verificationDocuments: {
        submittedAt: new Date(),
        verifiedAt: new Date()
      }
    });
    
    await admin.save();
    
    // Generate token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role, isVerified: admin.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isVerified: admin.isVerified,
        verificationStatus: admin.verificationStatus
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Make sure to export the new function
module.exports = { 
  register, 
  login, 
  submitVerification, 
  getProfile,
  registerAdmin  // Add this
};

