const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  bookVehicle,
  getMyVehicles
} = require('../controllers/vehicleController');
const { authMiddleware, sellerCanList } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================
router.get('/', getAllVehicles);

// ==================== NEARBY LIVESTOCK ROUTE ====================
router.get('/nearby/livestock', async (req, res) => {
  try {
    const { location, limit = 5 } = req.query;
    const Livestock = require('../models/Livestock');
    
    if (!location) {
      return res.status(400).json({ message: 'Location parameter is required' });
    }
    
    // Split location into parts for better matching
    const locationParts = location.split(/[,\s]+/).filter(part => part.trim().length > 0);
    
    // Create search conditions
    const searchConditions = [];
    
    // Exact match
    searchConditions.push({ location: { $regex: new RegExp(location, 'i') } });
    
    // Match individual parts
    locationParts.forEach(part => {
      if (part.length > 2) { // Ignore very short parts like "KZN"
        searchConditions.push({ location: { $regex: new RegExp(part, 'i') } });
      }
    });
    
    // Find livestock that are available and match location
    const nearbyLivestock = await Livestock.find({
      $or: searchConditions,
      status: 'available'
    })
    .populate('seller', 'name isVerified businessName phone')
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
    
    // If no livestock found in exact location, get any available livestock as alternatives
    let responseLivestock = nearbyLivestock;
    let message = null;
    
    if (nearbyLivestock.length === 0) {
      // Get any available livestock (fallback)
      responseLivestock = await Livestock.find({ status: 'available' })
        .populate('seller', 'name isVerified businessName phone')
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      
      message = "No livestock found in your exact location. Showing all available livestock.";
    } else if (nearbyLivestock.length < 3) {
      // If only a few found, supplement with other available livestock
      const additionalLivestock = await Livestock.find({
        status: 'available',
        _id: { $nin: nearbyLivestock.map(l => l._id) }
      })
      .populate('seller', 'name isVerified businessName phone')
      .limit(parseInt(limit) - nearbyLivestock.length)
      .sort({ createdAt: -1 });
      
      responseLivestock = [...nearbyLivestock, ...additionalLivestock];
      message = `Showing ${nearbyLivestock.length} livestock near ${location} and ${additionalLivestock.length} other available listings.`;
    }
    
    res.json({
      livestock: responseLivestock,
      totalFound: nearbyLivestock.length,
      message: message,
      searchLocation: location
    });
  } catch (error) {
    console.error('Error fetching nearby livestock:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== IMPORTANT: SPECIFIC ROUTES MUST COME BEFORE PARAMETERIZED ROUTES ====================
// Get authenticated user's vehicles - THIS MUST COME BEFORE /:id
router.get('/me', authMiddleware, sellerCanList, getMyVehicles);

// Get vehicle by ID - THIS COMES AFTER specific routes
router.get('/:id', getVehicleById);

// ==================== PROTECTED ROUTES ====================
router.use(authMiddleware);

// Create new vehicle
router.post('/', sellerCanList, createVehicle);

// Update vehicle
router.put('/:id', sellerCanList, updateVehicle);

// Delete vehicle
router.delete('/:id', deleteVehicle);

// Book vehicle
router.post('/book', bookVehicle);

module.exports = router;