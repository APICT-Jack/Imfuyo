const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Your existing Cloudinary upload
const {
  getAllLivestock,
  getLivestockById,
  createLivestock,
  updateLivestock,
  deleteLivestock,
  placeBid,
  purchaseLivestock,
  getSellerLivestock,
  getMyLivestock,
  toggleWatchlist,
  getWatchlist,
  getBiddingHistory,
  toggleFeatured
} = require('../controllers/livestockController');
const { authMiddleware, sellerCanList, optionalAuthMiddleware } = require('../middleware/auth');
const { validateLivestock, validateBid, validatePurchase } = require('../middleware/validation');

// ==================== PUBLIC ROUTES ====================
router.get('/', optionalAuthMiddleware, getAllLivestock);
router.get('/:id/bidding-history', getBiddingHistory);
router.get('/:id', optionalAuthMiddleware, getLivestockById);

// ==================== NEARBY VEHICLES ROUTE ====================
router.get('/nearby/vehicles', async (req, res) => {
  try {
    const { location, limit = 5 } = req.query;
    const Vehicle = require('../models/Vehicle');
    
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
    
    // Find vehicles that are available and match location
    const nearbyVehicles = await Vehicle.find({
      $or: searchConditions,
      available: true
    })
    .populate('owner', 'name businessName phone email isVerified')
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
    
    // If no vehicles found in exact location, get any available vehicles as alternatives
    let responseVehicles = nearbyVehicles;
    let message = null;
    
    if (nearbyVehicles.length === 0) {
      // Get any available vehicles (fallback)
      responseVehicles = await Vehicle.find({ available: true })
        .populate('owner', 'name businessName phone email isVerified')
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      
      message = "No vehicles found in your exact location. Showing all available vehicles.";
    } else if (nearbyVehicles.length < 3) {
      // If only a few found, supplement with other available vehicles
      const additionalVehicles = await Vehicle.find({
        available: true,
        _id: { $nin: nearbyVehicles.map(v => v._id) }
      })
      .populate('owner', 'name businessName phone email isVerified')
      .limit(parseInt(limit) - nearbyVehicles.length)
      .sort({ createdAt: -1 });
      
      responseVehicles = [...nearbyVehicles, ...additionalVehicles];
      message = `Showing ${nearbyVehicles.length} vehicle(s) near ${location} and ${additionalVehicles.length} other available vehicle(s).`;
    }
    
    res.json({
      vehicles: responseVehicles,
      totalFound: nearbyVehicles.length,
      message: message,
      searchLocation: location
    });
  } catch (error) {
    console.error('Error fetching nearby vehicles:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== PROTECTED ROUTES ====================
router.use(authMiddleware);

// ==================== LISTING MANAGEMENT ====================
router.post(
  '/', 
  sellerCanList,
  upload.array('images', 10),
  validateLivestock,
  createLivestock
);

router.put(
  '/:id',
  sellerCanList,
  upload.array('images', 10),
  updateLivestock
);

router.delete('/:id', sellerCanList, deleteLivestock);
router.patch('/:id/toggle-featured', toggleFeatured);

// ==================== BIDDING SYSTEM ====================
router.post('/:id/bid', validateBid, placeBid);
router.post('/:id/purchase', validatePurchase, purchaseLivestock);

// ==================== WATCHLIST SYSTEM ====================
router.get('/user/watchlist', getWatchlist);
router.post('/:id/watchlist', toggleWatchlist);

// ==================== SELLER SPECIFIC ====================
router.get('/seller/:sellerId/listings', getSellerLivestock);
router.get('/user/my-listings', getMyLivestock);

// ==================== BULK OPERATIONS ====================
router.patch('/bulk/update-status', async (req, res) => {
  try {
    const { listingIds, status } = req.body;
    const Livestock = require('../models/Livestock');
    
    const result = await Livestock.updateMany(
      { 
        _id: { $in: listingIds }, 
        seller: req.user.id,
        status: { $ne: 'sold' }
      },
      { status, badge: status === 'sold' ? 'Sold' : 'Available' }
    );
    
    res.json({
      message: `${result.modifiedCount} listings updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/bulk/delete', async (req, res) => {
  try {
    const { listingIds } = req.body;
    const Livestock = require('../models/Livestock');
    
    const result = await Livestock.deleteMany({
      _id: { $in: listingIds },
      seller: req.user.id,
      status: { $ne: 'sold' }
    });
    
    res.json({
      message: `${result.deletedCount} listings deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ANALYTICS ====================
router.get('/analytics/my-stats', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Livestock = require('../models/Livestock');
    const userId = req.user.id;
    
    const stats = await Livestock.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(userId) } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalValue: { 
          $sum: { 
            $cond: [
              { $eq: ['$orderType', 'once_off'] },
              { $multiply: ['$price', { $subtract: ['$quantity', '$availableQuantity'] }] },
              0
            ]
          }
        }
      }}
    ]);
    
    const activeBids = await Livestock.aggregate([
      { 
        $match: { 
          seller: new mongoose.Types.ObjectId(userId),
          orderType: 'bid',
          status: 'on_bid'
        }
      },
      { $group: {
        _id: null,
        totalBids: { $sum: { $size: '$bidDetails.bidHistory' } },
        highestBid: { $max: '$bidDetails.currentBid' }
      }}
    ]);
    
    res.json({ stats, activeBids: activeBids[0] || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;