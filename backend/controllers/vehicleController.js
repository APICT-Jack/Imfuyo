const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const User = require('../models/User');

const getAllVehicles = async (req, res) => {
  try {
    const { type, minPrice, maxPrice, location, page = 1, limit = 20 } = req.query;
    const query = { available: true };
    
    if (type) query.type = type;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }
    
    const vehicles = await Vehicle.find(query)
      .populate('owner', 'name businessName phone isVerified verificationStatus')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Vehicle.countDocuments(query);
    
    res.json({
      vehicles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'name businessName phone location isVerified verificationStatus');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// THIS FUNCTION MUST BE DEFINED
const getMyVehicles = async (req, res) => {
  try {
    console.log('getMyVehicles called - User ID:', req.user.id);
    
    const vehicles = await Vehicle.find({ owner: req.user.id })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${vehicles.length} vehicles for user ${req.user.id}`);
    
    res.json({ vehicles });
  } catch (error) {
    console.error('Error in getMyVehicles:', error);
    res.status(500).json({ message: error.message });
  }
};

const createVehicle = async (req, res) => {
  try {
    const owner = await User.findById(req.user.id);
    
    const vehicleData = {
      ...req.body,
      owner: req.user.id,
      ownerVerified: owner.isVerified || false,
      verificationWarning: !owner.isVerified
    };
    
    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();
    
    const response = {
      vehicle,
      message: owner.isVerified 
        ? 'Vehicle listed successfully' 
        : 'Vehicle listed but owner is not verified. Renters will see a verification warning.'
    };
    
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    console.log('=== UPDATE VEHICLE ===');
    console.log('Item ID:', req.params.id);
    console.log('User ID from token:', req.user.id);
    console.log('User Role:', req.user.role);
    
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    console.log('Item owner ID:', vehicle.owner.toString());
    console.log('User ID matches:', vehicle.owner.toString() === req.user.id.toString());
    
    // Convert both to strings for comparison
    const ownerIdString = vehicle.owner.toString();
    const userIdString = req.user.id.toString();
    
    // Check authorization - allow admin or owner
    if (ownerIdString !== userIdString && req.user.role !== 'admin') {
      console.log('Authorization failed: User does not own this vehicle');
      return res.status(403).json({ 
        message: 'Not authorized to update this vehicle',
        yourId: userIdString,
        ownerId: ownerIdString
      });
    }
    
    // Don't allow editing if vehicle is currently rented (available = false) 
    // unless they're just marking it as available
    if (!vehicle.available && vehicle.available !== req.body.available) {
      return res.status(400).json({ 
        message: 'Cannot edit vehicle details while it is on duty/rented. Mark as available first.' 
      });
    }
    
    // Fields that can be updated
    const allowedUpdates = [
      'type', 'model', 'capacity', 'licensePlate', 
      'pricePerDay', 'pricePerKm', 'description', 
      'location', 'features', 'available', 'images'
    ];
    
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).json({ message: 'Invalid update fields' });
    }
    
    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.owner;
    delete updateData.ownerVerified;
    delete updateData.createdAt;
    
    // Apply updates
    if (updateData.features && typeof updateData.features === 'string') {
      updateData.features = updateData.features.split(',').map(f => f.trim()).filter(f => f);
    }
    
    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('Update successful');
    res.json({
      vehicle: updated,
      message: 'Vehicle updated successfully'
    });
  } catch (error) {
    console.error('Error in updateVehicle:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    console.log('=== DELETE VEHICLE ===');
    console.log('Item ID:', req.params.id);
    console.log('User ID from token:', req.user.id);
    
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Convert both to strings for comparison
    const ownerIdString = vehicle.owner.toString();
    const userIdString = req.user.id.toString();
    
    console.log('Comparing owner:', ownerIdString, 'vs user:', userIdString);
    
    // Check if user owns the vehicle or is admin
    if (ownerIdString !== userIdString && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to delete this vehicle',
        yourId: userIdString,
        ownerId: ownerIdString
      });
    }
    
    // Don't allow deletion if there are active bookings
    const activeBookings = await Booking.findOne({ 
      vehicle: req.params.id, 
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (activeBookings) {
      return res.status(400).json({ 
        message: 'Cannot delete vehicle with active bookings. Cancel bookings first.' 
      });
    }
    
    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error in deleteVehicle:', error);
    res.status(500).json({ message: error.message });
  }
};

const bookVehicle = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, customerName, customerEmail, customerPhone } = req.body;
    
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || !vehicle.available) {
      return res.status(404).json({ message: 'Vehicle not available' });
    }
    
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const totalPrice = days * vehicle.pricePerDay;
    
    const booking = new Booking({
      vehicle: vehicleId,
      user: req.user?.id,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      totalPrice,
      ownerVerified: vehicle.ownerVerified
    });
    
    await booking.save();
    
    res.status(201).json({ 
      booking, 
      message: vehicle.ownerVerified 
        ? 'Booking request submitted successfully' 
        : 'Booking request submitted. Note: Owner is not verified, proceed at your own risk.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  getMyVehicles,  // MAKE SURE THIS IS EXPORTED
  createVehicle,
  updateVehicle,
  deleteVehicle,
  bookVehicle
};