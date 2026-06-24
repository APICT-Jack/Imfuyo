// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const User = require('../models/User');

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(adminOnly);

/**
 * Dashboard Statistics
 */
router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  // Get models (handle both Livestock and Vehicle models)
  let LivestockModel, VehicleModel;
  try {
    LivestockModel = mongoose.model('Livestock');
  } catch (e) {
    LivestockModel = null;
  }
  
  try {
    VehicleModel = mongoose.model('Vehicle');
  } catch (e) {
    VehicleModel = null;
  }

  const totalUsers = await User.countDocuments();
  const totalSellers = await User.countDocuments({ role: 'seller' });
  const totalBuyers = await User.countDocuments({ role: 'buyer' });
  const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending' });
  
  let totalListings = 0;
  if (LivestockModel) totalListings += await LivestockModel.countDocuments();
  if (VehicleModel) totalListings += await VehicleModel.countDocuments();
  
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role createdAt verificationStatus');
  
  // Get recent listings
  let recentListings = [];
  if (LivestockModel) {
    const livestockListings = await LivestockModel.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('seller', 'name email');
    recentListings.push(...livestockListings);
  }
  if (VehicleModel) {
    const vehicleListings = await VehicleModel.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('seller', 'name email');
    recentListings.push(...vehicleListings);
  }
  recentListings.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  
  // Calculate growth percentages (compare with last month)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const usersLastMonth = await User.countDocuments({ createdAt: { $lt: new Date(), $gte: lastMonth } });
  const userGrowth = usersLastMonth > 0 ? ((totalUsers - usersLastMonth) / usersLastMonth * 100).toFixed(1) : 0;
  
  res.json({
    totalUsers,
    totalSellers,
    totalBuyers,
    totalListings,
    pendingVerifications,
    recentUsers,
    recentListings,
    userGrowth: `${userGrowth > 0 ? '+' : ''}${userGrowth}%`,
    listingGrowth: '+8%',
    revenueGrowth: '+12%',
    activeSessions: Math.floor(Math.random() * 100) + 20 // Placeholder - implement actual session tracking
  });
}));

/**
 * Get all users with filters
 */
router.get('/users', asyncHandler(async (req, res) => {
  const { 
    role, 
    verificationStatus, 
    isVerified,
    search, 
    page = 1, 
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const query = {};
  
  if (role && role !== 'all') query.role = role;
  if (verificationStatus && verificationStatus !== 'all') query.verificationStatus = verificationStatus;
  if (isVerified !== undefined && isVerified !== 'all') query.isVerified = isVerified === 'true';
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } }
    ];
  }
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const users = await User.find(query)
    .select('-password')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort(sortOptions);
  
  const total = await User.countDocuments(query);
  
  res.json({
    success: true,
    users,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    limit: parseInt(limit)
  });
}));

/**
 * Get user details
 */
router.get('/users/:userId', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) {
    throw new NotFoundError('User');
  }
  
  // Get user's listings
  let userListings = [];
  try {
    const LivestockModel = mongoose.model('Livestock');
    userListings = await LivestockModel.find({ seller: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
  } catch (e) {
    // Model not found
  }
  
  try {
    const VehicleModel = mongoose.model('Vehicle');
    const vehicleListings = await VehicleModel.find({ seller: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    userListings.push(...vehicleListings);
  } catch (e) {
    // Model not found
  }
  
  res.json({
    success: true,
    user,
    listings: userListings
  });
}));

/**
 * Verify user (approve/reject verification)
 */
router.post('/users/:userId/verify', asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  if (status === 'approved') {
    user.verificationStatus = 'approved';
    user.isVerified = true;
    user.verificationDocuments.verifiedAt = new Date();
    user.verificationDocuments.rejectionReason = null;
  } else if (status === 'rejected') {
    user.verificationStatus = 'rejected';
    user.isVerified = false;
    user.verificationDocuments.verifiedAt = new Date();
    user.verificationDocuments.rejectionReason = rejectionReason || 'Verification rejected';
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be "approved" or "rejected"'
    });
  }
  
  await user.save();
  
  // TODO: Send email notification to user about verification decision
  
  res.json({
    success: true,
    message: `User verification ${status} successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus
    }
  });
}));

/**
 * Update user role
 */
router.put('/users/:userId/role', asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  if (!['seller', 'buyer', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be seller, buyer, or admin'
    });
  }
  
  user.role = role;
  await user.save();
  
  res.json({
    success: true,
    message: `User role updated to ${role}`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
}));

/**
 * Suspend user
 */
router.post('/users/:userId/suspend', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  user.isSuspended = true;
  user.suspensionReason = reason || 'Violation of platform terms';
  user.suspendedAt = new Date();
  await user.save();
  
  res.json({
    success: true,
    message: 'User suspended successfully',
    user: {
      id: user._id,
      name: user.name,
      isSuspended: user.isSuspended
    }
  });
}));

/**
 * Activate user (remove suspension)
 */
router.post('/users/:userId/activate', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  user.isSuspended = false;
  user.suspensionReason = null;
  user.suspendedAt = null;
  await user.save();
  
  res.json({
    success: true,
    message: 'User activated successfully',
    user: {
      id: user._id,
      name: user.name,
      isSuspended: user.isSuspended
    }
  });
}));

/**
 * Get all listings (both livestock and vehicles)
 */
router.get('/listings', asyncHandler(async (req, res) => {
  const { 
    status, 
    type, 
    orderType,
    search,
    page = 1, 
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  let LivestockModel, VehicleModel;
  try {
    LivestockModel = mongoose.model('Livestock');
  } catch (e) {
    LivestockModel = null;
  }
  
  try {
    VehicleModel = mongoose.model('Vehicle');
  } catch (e) {
    VehicleModel = null;
  }
  
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (orderType && orderType !== 'all') query.orderType = orderType;
  
  if (search) {
    query.$or = [
      { breed: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  let allListings = [];
  
  // Fetch from Livestock model
  if (LivestockModel) {
    const livestockQuery = { ...query };
    if (type && type !== 'all' && ['cattle', 'sheep', 'goat', 'pig', 'chicken', 'horse', 'other'].includes(type)) {
      livestockQuery.type = type;
    }
    
    const livestockListings = await LivestockModel.find(livestockQuery)
      .populate('seller', 'name email phone businessName')
      .sort(sortOptions)
      .lean();
    
    allListings.push(...livestockListings.map(l => ({ ...l, category: 'livestock' })));
  }
  
  // Fetch from Vehicle model
  if (VehicleModel) {
    const vehicleQuery = { ...query };
    if (type && type !== 'all' && ['tractor', 'truck', 'trailer', 'other'].includes(type)) {
      vehicleQuery.type = type;
    }
    
    const vehicleListings = await VehicleModel.find(vehicleQuery)
      .populate('seller', 'name email phone businessName')
      .sort(sortOptions)
      .lean();
    
    allListings.push(...vehicleListings.map(v => ({ ...v, category: 'vehicle' })));
  }
  
  // Sort combined results
  allListings.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    } else {
      return aValue > bValue ? 1 : -1;
    }
  });
  
  // Paginate
  const total = allListings.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedListings = allListings.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    listings: paginatedListings,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    limit: parseInt(limit)
  });
}));

/**
 * Get listing details by ID (works for both livestock and vehicles)
 */
router.get('/listings/:listingId', asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  
  let LivestockModel, VehicleModel;
  try {
    LivestockModel = mongoose.model('Livestock');
  } catch (e) {
    LivestockModel = null;
  }
  
  try {
    VehicleModel = mongoose.model('Vehicle');
  } catch (e) {
    VehicleModel = null;
  }
  
  let listing = null;
  let category = null;
  
  // Try to find in Livestock
  if (LivestockModel) {
    listing = await LivestockModel.findById(listingId)
      .populate('seller', 'name email phone businessName isVerified verificationStatus')
      .populate('bids.bidder', 'name email');
    if (listing) category = 'livestock';
  }
  
  // Try to find in Vehicle
  if (!listing && VehicleModel) {
    listing = await VehicleModel.findById(listingId)
      .populate('seller', 'name email phone businessName isVerified verificationStatus');
    if (listing) category = 'vehicle';
  }
  
  if (!listing) {
    throw new NotFoundError('Listing');
  }
  
  res.json({
    success: true,
    listing,
    category
  });
}));

/**
 * Approve listing
 */
router.post('/listings/:listingId/approve', asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  
  let LivestockModel, VehicleModel;
  try {
    LivestockModel = mongoose.model('Livestock');
  } catch (e) {
    LivestockModel = null;
  }
  
  try {
    VehicleModel = mongoose.model('Vehicle');
  } catch (e) {
    VehicleModel = null;
  }
  
  let listing = null;
  let model = null;
  
  if (LivestockModel) {
    listing = await LivestockModel.findById(listingId);
    if (listing) model = LivestockModel;
  }
  
  if (!listing && VehicleModel) {
    listing = await VehicleModel.findById(listingId);
    if (listing) model = VehicleModel;
  }
  
  if (!listing) {
    throw new NotFoundError('Listing');
  }
  
  listing.status = 'active';
  listing.approvedAt = new Date();
  listing.approvedBy = req.user.id;
  await listing.save();
  
  res.json({
    success: true,
    message: 'Listing approved successfully',
    listing
  });
}));

/**
 * Reject listing
 */
router.post('/listings/:listingId/reject', asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const { reason } = req.body;
  
  let LivestockModel, VehicleModel;
  try {
    LivestockModel = mongoose.model('Livestock');
  } catch (e) {
    LivestockModel = null;
  }
  
  try {
    VehicleModel = mongoose.model('Vehicle');
  } catch (e) {
    VehicleModel = null;
  }
  
  let listing = null;
  let model = null;
  
  if (LivestockModel) {
    listing = await LivestockModel.findById(listingId);
    if (listing) model = LivestockModel;
  }
  
  if (!listing && VehicleModel) {
    listing = await VehicleModel.findById(listingId);
    if (listing) model = VehicleModel;
  }
  
  if (!listing) {
    throw new NotFoundError('Listing');
  }
  
  listing.status = 'rejected';
  listing.rejectionReason = reason || 'Listing does not comply with platform guidelines';
  listing.rejectedAt = new Date();
  listing.rejectedBy = req.user.id;
  await listing.save();
  
  res.json({
    success: true,
    message: 'Listing rejected',
    listing
  });
}));

/**
 * Delete listing (hard delete)
 */
router.delete('/listings/:listingId', asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  
  let LivestockModel, VehicleModel;
  try {
    LivestockModel = mongoose.model('Livestock');
  } catch (e) {
    LivestockModel = null;
  }
  
  try {
    VehicleModel = mongoose.model('Vehicle');
  } catch (e) {
    VehicleModel = null;
  }
  
  let deleted = false;
  
  if (LivestockModel) {
    const result = await LivestockModel.findByIdAndDelete(listingId);
    if (result) deleted = true;
  }
  
  if (!deleted && VehicleModel) {
    const result = await VehicleModel.findByIdAndDelete(listingId);
    if (result) deleted = true;
  }
  
  if (!deleted) {
    throw new NotFoundError('Listing');
  }
  
  res.json({
    success: true,
    message: 'Listing deleted successfully'
  });
}));

/**
 * Feature listing (promote to featured)
 */
router.post('/listings/:listingId/feature', asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const { duration = 7 } = req.body; // duration in days
  
  let LivestockModel, VehicleModel;
  try {
    LivestockModel = mongoose.model('Livestock');
  } catch (e) {
    LivestockModel = null;
  }
  
  try {
    VehicleModel = mongoose.model('Vehicle');
  } catch (e) {
    VehicleModel = null;
  }
  
  let listing = null;
  let model = null;
  
  if (LivestockModel) {
    listing = await LivestockModel.findById(listingId);
    if (listing) model = LivestockModel;
  }
  
  if (!listing && VehicleModel) {
    listing = await VehicleModel.findById(listingId);
    if (listing) model = VehicleModel;
  }
  
  if (!listing) {
    throw new NotFoundError('Listing');
  }
  
  listing.isFeatured = true;
  listing.featuredUntil = new Date();
  listing.featuredUntil.setDate(listing.featuredUntil.getDate() + duration);
  await listing.save();
  
  res.json({
    success: true,
    message: `Listing featured for ${duration} days`,
    listing
  });
}));

/**
 * System metrics (existing)
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = {
    system: {
      platform: os.platform(),
      release: os.release(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      cpuCount: os.cpus().length,
      hostname: os.hostname()
    },
    process: {
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      version: process.version,
      env: process.env.NODE_ENV
    },
    mongodb: {
      state: mongoose.STATES[mongoose.connection.readyState],
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections).length
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(metrics);
}));

/**
 * Database stats (existing)
 */
router.get('/db-stats', asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  
  const stats = {
    database: {
      name: db.databaseName,
      collections: await db.listCollections().toArray(),
      stats: await db.stats()
    },
    collections: {}
  };
  
  // Get stats for each collection
  for (const collection of stats.database.collections) {
    const coll = db.collection(collection.name);
    stats.collections[collection.name] = {
      count: await coll.countDocuments(),
      stats: await coll.stats()
    };
  }
  
  res.json(stats);
}));

/**
 * System logs (existing)
 */
router.get('/logs/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { lines = 100 } = req.query;
  
  const fs = require('fs').promises;
  const path = require('path');
  
  const logFile = path.join(__dirname, '..', 'logs', `${type}.log`);
  
  try {
    const data = await fs.readFile(logFile, 'utf8');
    const logLines = data.trim().split('\n');
    const lastLines = logLines.slice(-parseInt(lines));
    
    res.json({
      type,
      lines: lastLines.length,
      content: lastLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return line;
        }
      })
    });
  } catch (error) {
    res.status(404).json({ message: 'Log file not found', type });
  }
}));

/**
 * Get platform activity statistics
 */
router.get('/activity-stats', asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get daily user registrations
  const userRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  // Get daily listings created
  let dailyListings = [];
  try {
    const LivestockModel = mongoose.model('Livestock');
    dailyListings = await LivestockModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
  } catch (e) {
    // Model not found
  }
  
  res.json({
    success: true,
    period: `${days} days`,
    userRegistrations,
    dailyListings
  });
}));

module.exports = router;