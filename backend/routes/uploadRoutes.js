const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authMiddleware } = require('../middleware/auth');

// Allow both authenticated and non-authenticated uploads
// For registration/verification without token
router.post('/image', (req, res) => {
  // Check if token exists and is valid, but don't fail if it doesn't
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // Proceed with upload even without auth for public uploads
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      res.json({ url: req.file.path });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
});

router.post('/images', (req, res) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    try {
      const urls = req.files.map(file => file.path);
      res.json({ urls });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
});

module.exports = router;