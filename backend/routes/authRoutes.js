const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  submitVerification, 
  getProfile,
  registerAdmin  // Import the new function
} = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify', authMiddleware, submitVerification);
router.get('/profile', authMiddleware, getProfile);

// Admin registration routes
router.post('/register-admin', registerAdmin); // Public route for first admin
router.post('/admin/register', authMiddleware, adminOnly, registerAdmin); // Protected route for additional admins

module.exports = router;