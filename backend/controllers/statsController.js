const Livestock = require('../models/Livestock');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const getLivestockStats = async (req, res) => {
  try {
    // Count livestock by status
    const available = await Livestock.countDocuments({ status: 'available' });
    const sold = await Livestock.countDocuments({ status: 'sold' });
    const reserved = await Livestock.countDocuments({ status: 'reserved' });
    const total = await Livestock.countDocuments();
    
    // Get counts by type
    const byType = await Livestock.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('Livestock Stats:', { available, sold, reserved, total }); // Debug log
    
    res.json({
      available,
      sold,
      reserved,
      total,
      byType
    });
  } catch (error) {
    console.error('Error fetching livestock stats:', error);
    res.status(500).json({ message: error.message });
  }
};

const getVehicleStats = async (req, res) => {
  try {
    const available = await Vehicle.countDocuments({ available: true });
    const rented = await Vehicle.countDocuments({ available: false });
    const total = await Vehicle.countDocuments();
    
    // Get counts by type
    const byType = await Vehicle.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('Vehicle Stats:', { available, rented, totalVehicles: total }); // Debug log
    
    res.json({
      available,
      rented,
      totalVehicles: total,
      byType
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({ message: error.message });
  }
};

const getUserStats = async (req, res) => {
  try {
    const sellers = await User.countDocuments({ role: 'seller' });
    const buyers = await User.countDocuments({ role: 'buyer' });
    const verifiedSellers = await User.countDocuments({ role: 'seller', isVerified: true });
    const pendingVerification = await User.countDocuments({ role: 'seller', verificationStatus: 'pending' });
    const totalUsers = await User.countDocuments();
    
    console.log('User Stats:', { sellers, buyers, verifiedSellers, totalUsers }); // Debug log
    
    res.json({
      sellers,
      buyers,
      verifiedSellers,
      pendingVerification,
      totalUsers
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLivestockStats,
  getVehicleStats,
  getUserStats
};