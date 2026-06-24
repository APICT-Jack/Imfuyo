const Livestock = require('../models/Livestock');
const User = require('../models/User');

// Get all livestock with advanced filtering
const getAllLivestock = async (req, res) => {
  try {
    const { 
      type, 
      minPrice, 
      maxPrice, 
      location, 
      status, 
      orderType,
      badge,
      breed,
      minAge,
      maxAge,
      healthStatus,
      vaccinated,
      sellerVerified,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      limit = 20,
      search
    } = req.query;
    
    const query = {};
    
    // Only show available/on_bid listings by default unless status specified
    if (!status) {
      query.status = { $in: ['available', 'on_bid'] };
    } else {
      query.status = status;
    }
    
    if (type) query.type = type;
    if (orderType) query.orderType = orderType;
    if (badge) query.badge = badge;
    if (breed) query.breed = { $regex: breed, $options: 'i' };
    if (healthStatus) query.healthStatus = healthStatus;
    if (vaccinated === 'true') query.vaccinated = true;
    if (sellerVerified === 'true') query.sellerVerified = true;
    if (isFeatured === 'true') query.isFeatured = true;
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Age range filter
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = Number(minAge);
      if (maxAge) query.age.$lte = Number(maxAge);
    }
    
    // Price filter (handles both fixed price and bid starting price)
    if (minPrice || maxPrice) {
      query.$or = [
        { orderType: 'once_off', price: {} },
        { orderType: 'bid', 'bidDetails.startingBid': {} }
      ];
      
      if (minPrice) {
        query.$or[0].price.$gte = Number(minPrice);
        query.$or[1]['bidDetails.startingBid'].$gte = Number(minPrice);
      }
      if (maxPrice) {
        query.$or[0].price.$lte = Number(maxPrice);
        query.$or[1]['bidDetails.startingBid'].$lte = Number(maxPrice);
      }
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Ensure listing hasn't expired
    query.expiresAt = { $gt: new Date() };
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const livestock = await Livestock.find(query)
      .populate('seller', 'name businessName location isVerified verificationStatus phone email')
      .populate('bidDetails.currentBidder', 'name businessName')
      .populate('watchers', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Livestock.countDocuments(query);
    
    // Add additional info to each listing
    const enhancedLivestock = livestock.map(item => {
      const itemObj = item.toObject();
      if (item.orderType === 'bid') {
        itemObj.isBiddingActive = item.isBiddingActive;
        itemObj.remainingBidTime = item.formattedRemainingTime;
      }
      return itemObj;
    });
    
    res.json({
      livestock: enhancedLivestock,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      filters: { type, orderType, status, minPrice, maxPrice }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get livestock by ID with full details
const getLivestockById = async (req, res) => {
  try {
    // Increment view count
    await Livestock.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    
    const livestock = await Livestock.findById(req.params.id)
      .populate('seller', 'name businessName phone location isVerified verificationStatus email')
      .populate('bidDetails.currentBidder', 'name businessName')
      .populate('bidDetails.bidHistory.bidder', 'name businessName')
      .populate('watchers', 'name email');
    
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    // Check if listing has expired
    if (livestock.expiresAt < new Date() && livestock.status !== 'sold') {
      livestock.status = 'available';
      livestock.badge = 'Available';
      await livestock.save();
    }
    
    const response = livestock.toObject();
    if (livestock.orderType === 'bid') {
      response.isBiddingActive = livestock.isBiddingActive;
      response.remainingBidTime = livestock.formattedRemainingTime;
      response.bidDetails.bidCount = livestock.bidDetails.bidHistory.length;
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create livestock listing
const createLivestock = async (req, res) => {
  try {
    console.log('=== CREATE LIVESTOCK ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Order type:', req.body.orderType);
    
    const seller = await User.findById(req.user.id);
    
    if (!seller) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { orderType, bidDetails, ...otherData } = req.body;
    
    // Validate bid-specific fields
    if (orderType === 'bid') {
      console.log('Processing bid listing');
      console.log('Bid details received:', bidDetails);
      
      if (!bidDetails || !bidDetails.startingBid || !bidDetails.bidEndTime) {
        return res.status(400).json({ 
          message: 'Bid listings require startingBid and bidEndTime',
          receivedBidDetails: bidDetails 
        });
      }
      
      // Ensure bid end time is in the future
      const bidEndTime = new Date(bidDetails.bidEndTime);
      if (bidEndTime <= new Date()) {
        return res.status(400).json({ 
          message: 'Bid end time must be in the future' 
        });
      }
    }
    
    // Prepare the livestock data
    const livestockData = {
      ...otherData,
      orderType: orderType || 'once_off',
      seller: req.user.id,
      sellerVerified: seller.isVerified || false,
      verificationWarning: !seller.isVerified,
      availableQuantity: otherData.quantity || 1,
    };
    
    // Add bid-specific fields if it's a bid listing
    if (orderType === 'bid') {
      livestockData.bidDetails = {
        startingBid: bidDetails.startingBid,
        currentBid: bidDetails.startingBid,
        minimumIncrement: bidDetails.minimumIncrement || (bidDetails.startingBid * 0.05),
        reservePrice: bidDetails.reservePrice || null,
        bidEndTime: bidDetails.bidEndTime,
        bidHistory: []
      };
      livestockData.status = 'on_bid';
      livestockData.badge = 'On Bid';
    }
    
    console.log('Final livestock data:', JSON.stringify(livestockData, null, 2));
    
    const livestock = new Livestock(livestockData);
    await livestock.save();
    
    const response = {
      livestock,
      message: seller.isVerified 
        ? 'Livestock listed successfully' 
        : 'Livestock listed but seller is not verified. Buyers will see a verification warning.',
      ...(orderType === 'bid' && {
        bidInfo: {
          startingBid: livestock.bidDetails.startingBid,
          bidEndTime: livestock.bidDetails.bidEndTime,
          minimumIncrement: livestock.bidDetails.minimumIncrement
        }
      })
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Create livestock error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// Update livestock listing
// Update livestock listing
const updateLivestock = async (req, res) => {
  try {
    console.log('=== UPDATE LIVESTOCK ===');
    console.log('Item ID:', req.params.id);
    console.log('User ID from token:', req.user.id);
    console.log('User Role:', req.user.role);
    
    const livestock = await Livestock.findById(req.params.id);
    
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    console.log('Item seller ID:', livestock.seller.toString());
    console.log('User ID matches:', livestock.seller.toString() === req.user.id.toString());
    
    // Convert both to strings for comparison
    const sellerIdString = livestock.seller.toString();
    const userIdString = req.user.id.toString();
    
    // Check authorization - allow admin or owner
    if (sellerIdString !== userIdString && req.user.role !== 'admin') {
      console.log('Authorization failed: User does not own this item');
      return res.status(403).json({ 
        message: 'Not authorized to update this listing',
        yourId: userIdString,
        sellerId: sellerIdString
      });
    }
    
    // Prevent updates if listing is sold
    if (livestock.status === 'sold') {
      return res.status(400).json({ message: 'Cannot update a sold listing' });
    }
    
    // If there are bids, restrict what can be updated
    if (livestock.orderType === 'bid' && livestock.bidDetails && livestock.bidDetails.bidHistory && livestock.bidDetails.bidHistory.length > 0) {
      // Only allow limited updates if bids have been placed
      const allowedUpdates = ['description', 'images', 'videos', 'healthStatus'];
      const requestedUpdates = Object.keys(req.body);
      const isAllowed = requestedUpdates.every(update => allowedUpdates.includes(update));
      
      if (!isAllowed) {
        return res.status(400).json({ 
          message: 'Cannot modify price or bid details after bids have been placed' 
        });
      }
    }
    
    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.seller;
    delete updateData.sellerVerified;
    delete updateData.createdAt;
    delete updateData.viewCount;
    
    const updated = await Livestock.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'name businessName isVerified');
    
    console.log('Update successful');
    res.json({
      livestock: updated,
      message: 'Listing updated successfully'
    });
  } catch (error) {
    console.error('Error in updateLivestock:', error);
    res.status(500).json({ message: error.message });
  }
};

// Place a bid on livestock
const placeBid = async (req, res) => {
  try {
    const { bidAmount } = req.body;
    const livestockId = req.params.id;
    const userId = req.user.id;
    
    const livestock = await Livestock.findById(livestockId);
    
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    if (livestock.orderType !== 'bid') {
      return res.status(400).json({ message: 'This is not a bid listing' });
    }
    
    if (livestock.seller.toString() === userId) {
      return res.status(400).json({ message: 'You cannot bid on your own listing' });
    }
    
    try {
      await livestock.placeBid(userId, bidAmount);
      
      // Populate bidder info for response
      await livestock.populate('bidDetails.currentBidder', 'name businessName');
      await livestock.populate('bidDetails.bidHistory.bidder', 'name businessName');
      
      res.json({
        message: 'Bid placed successfully',
        currentBid: livestock.bidDetails.currentBid,
        currentBidder: livestock.bidDetails.currentBidder,
        reserveMet: livestock.bidDetails.reserveMet,
        bidCount: livestock.bidDetails.bidHistory.length
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Purchase livestock (for once_off or buying out a bid)
const purchaseLivestock = async (req, res) => {
  try {
    const { quantity = 1, buyoutPrice } = req.body;
    const livestockId = req.params.id;
    const userId = req.user.id;
    
    const livestock = await Livestock.findById(livestockId);
    
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    if (livestock.seller.toString() === userId) {
      return res.status(400).json({ message: 'You cannot purchase your own listing' });
    }
    
    // Handle bid buyout if applicable
    if (livestock.orderType === 'bid' && buyoutPrice) {
      if (buyoutPrice < livestock.bidDetails.currentBid) {
        return res.status(400).json({ message: 'Buyout price must be at least current bid' });
      }
      
      // Process buyout
      await livestock.placeBid(userId, buyoutPrice);
      await livestock.reduceQuantity(livestock.availableQuantity);
      
      return res.json({
        message: 'Buyout successful',
        livestock: livestock,
        transaction: {
          type: 'buyout',
          amount: buyoutPrice,
          livestockId: livestock._id
        }
      });
    }
    
    // Handle once_off purchase
    if (livestock.orderType === 'once_off') {
      if (quantity > livestock.availableQuantity) {
        return res.status(400).json({ 
          message: `Only ${livestock.availableQuantity} available` 
        });
      }
      
      const totalPrice = livestock.price * quantity;
      
      await livestock.reduceQuantity(quantity);
      
      res.json({
        message: 'Purchase successful',
        transaction: {
          type: 'purchase',
          quantity,
          unitPrice: livestock.price,
          totalPrice,
          livestockId: livestock._id
        },
        remainingQuantity: livestock.availableQuantity,
        status: livestock.status
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get seller's listings
const getSellerLivestock = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const sellerId = req.params.sellerId || req.user.id;
    
    const query = { seller: sellerId };
    if (status) query.status = status;
    
    const livestock = await Livestock.find(query)
      .populate('bidDetails.currentBidder', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Livestock.countDocuments(query);
    
    // Calculate seller metrics
    const metrics = {
      totalListings: total,
      activeListings: await Livestock.countDocuments({ 
        seller: sellerId, 
        status: { $in: ['available', 'on_bid'] } 
      }),
      soldListings: await Livestock.countDocuments({ seller: sellerId, status: 'sold' }),
      totalViews: livestock.reduce((sum, item) => sum + (item.viewCount || 0), 0),
      activeBids: await Livestock.countDocuments({ 
        seller: sellerId, 
        orderType: 'bid', 
        status: 'on_bid' 
      })
    };
    
    res.json({
      livestock,
      metrics,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get authenticated user's livestock listings
const getMyLivestock = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { seller: req.user.id };
    if (status) query.status = status;
    
    const livestock = await Livestock.find(query)
      .populate('bidDetails.currentBidder', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Livestock.countDocuments(query);
    
    res.json({
      livestock,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Watch/unwatch listing
const toggleWatchlist = async (req, res) => {
  try {
    const livestock = await Livestock.findById(req.params.id);
    
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    const userId = req.user.id;
    const isWatching = livestock.watchers.includes(userId);
    
    if (isWatching) {
      livestock.watchers = livestock.watchers.filter(
        id => id.toString() !== userId
      );
      await livestock.save();
      res.json({ message: 'Removed from watchlist', watching: false });
    } else {
      livestock.watchers.push(userId);
      await livestock.save();
      res.json({ message: 'Added to watchlist', watching: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's watchlist
const getWatchlist = async (req, res) => {
  try {
    const livestock = await Livestock.find({ 
      watchers: req.user.id,
      expiresAt: { $gt: new Date() }
    })
      .populate('seller', 'name businessName')
      .populate('bidDetails.currentBidder', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ watchlist: livestock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete livestock listing
const deleteLivestock = async (req, res) => {
  try {
    console.log('=== DELETE LIVESTOCK ===');
    console.log('Item ID:', req.params.id);
    console.log('User ID from token:', req.user.id);
    console.log('User ID type:', typeof req.user.id);
    console.log('User Role:', req.user.role);
    
    const livestock = await Livestock.findById(req.params.id);
    
    if (!livestock) {
      console.log('Livestock not found');
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    console.log('Item seller ID:', livestock.seller);
    console.log('Item seller ID type:', typeof livestock.seller);
    console.log('Item seller ID as string:', livestock.seller.toString());
    
    // Convert both to strings for comparison
    const sellerIdString = livestock.seller.toString();
    const userIdString = req.user.id.toString();
    
    console.log('Comparing:', sellerIdString, 'vs', userIdString);
    console.log('IDs match:', sellerIdString === userIdString);
    
    // Check authorization - allow admin or owner
    if (sellerIdString !== userIdString && req.user.role !== 'admin') {
      console.log('Authorization failed: User does not own this item');
      return res.status(403).json({ 
        message: 'Not authorized to delete this listing',
        yourId: userIdString,
        sellerId: sellerIdString
      });
    }
    
    // Check if there are active bids
    if (livestock.orderType === 'bid' && livestock.bidDetails && livestock.bidDetails.bidHistory && livestock.bidDetails.bidHistory.length > 0) {
      console.log('Cannot delete: Active bids exist');
      return res.status(400).json({ 
        message: 'Cannot delete listing with active bids. Mark as sold instead.' 
      });
    }
    
    // Check if item is already sold
    if (livestock.status === 'sold') {
      console.log('Cannot delete: Item already sold');
      return res.status(400).json({ 
        message: 'Cannot delete a sold listing' 
      });
    }
    
    await livestock.deleteOne();
    console.log('Item deleted successfully');
    res.json({ message: 'Livestock listing removed successfully' });
    
  } catch (error) {
    console.error('Error in deleteLivestock:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get bidding history for a listing
const getBiddingHistory = async (req, res) => {
  try {
    const livestock = await Livestock.findById(req.params.id)
      .populate('bidDetails.bidHistory.bidder', 'name businessName');
    
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    res.json({
      livestockId: livestock._id,
      orderType: livestock.orderType,
      startingBid: livestock.bidDetails?.startingBid,
      currentBid: livestock.bidDetails?.currentBid,
      reservePrice: livestock.bidDetails?.reservePrice,
      reserveMet: livestock.bidDetails?.reserveMet,
      bidEndTime: livestock.bidDetails?.bidEndTime,
      bidHistory: livestock.bidDetails?.bidHistory || [],
      totalBids: livestock.bidDetails?.bidHistory?.length || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Feature/unfeature listing (admin/seller)
const toggleFeatured = async (req, res) => {
  try {
    const livestock = await Livestock.findById(req.params.id);
    
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found' });
    }
    
    if (livestock.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    livestock.isFeatured = !livestock.isFeatured;
    if (livestock.isFeatured) {
      livestock.featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    } else {
      livestock.featuredUntil = null;
    }
    
    await livestock.save();
    
    res.json({ 
      message: `Listing ${livestock.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      isFeatured: livestock.isFeatured,
      featuredUntil: livestock.featuredUntil
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== EXPORT ALL FUNCTIONS ====================
module.exports = {
  getAllLivestock,
  getLivestockById,
  createLivestock,
  updateLivestock,
  deleteLivestock,
  placeBid,
  purchaseLivestock,
  getSellerLivestock,
  getMyLivestock,  // Fixed: Changed from MyLivestock to getMyLivestock
  toggleWatchlist,
  getWatchlist,
  getBiddingHistory,
  toggleFeatured
};