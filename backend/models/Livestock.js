const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['cattle', 'sheep', 'goat', 'pig', 'chicken', 'horse', 'other']
  },
  breed: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  ageUnit: {
    type: String,
    enum: ['months', 'years'],
    default: 'months'
  },
  weight: {
    type: Number
  },
  price: {
    type: Number,
    required: function() {
      return this.orderType === 'once_off'; // Only required for fixed price listings
    },
    min: 0
  },
  
  // NEW: Order Type
  orderType: {
    type: String,
    enum: ['once_off', 'bid'],
    default: 'once_off',
    required: true
  },
  
  // NEW: Badge System
  badge: {
    type: String,
    enum: ['Available', 'Sold', 'On Bid'],
    default: 'Available'
  },
  
  // NEW: Bidding System
  bidDetails: {
    startingBid: {
      type: Number,
      required: function() {
        return this.orderType === 'bid';
      }
    },
    currentBid: {
      type: Number,
      default: null
    },
    currentBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    minimumIncrement: {
      type: Number,
      default: function() {
        return this.startingBid ? this.startingBid * 0.05 : 10;
      }
    },
    reservePrice: {
      type: Number,
      default: null
    },
    reserveMet: {
      type: Boolean,
      default: false
    },
    bidEndTime: {
      type: Date,
      required: function() {
        return this.orderType === 'bid';
      }
    },
    bidHistory: [{
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isAutoBid: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  
  // NEW: Track available quantity for partial purchases
  availableQuantity: {
    type: Number,
    required: true,
    default: function() {
      return this.quantity;
    }
  },
  
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  
  // NEW: Video upload support
  videos: [{
    type: String
  }],
  
  healthStatus: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  vaccinated: {
    type: Boolean,
    default: false
  },
  
  // NEW: Medical records
  medicalRecords: [{
    recordType: {
      type: String,
      enum: ['vaccination', 'treatment', 'checkup', 'certificate']
    },
    date: Date,
    description: String,
    documentUrl: String,
    veterinarian: String
  }],
  
  location: {
    type: String,
    required: true
  },
  
  // NEW: Coordinates for map view
  coordinates: {
    lat: Number,
    lng: Number
  },
  
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved', 'on_bid'],
    default: 'available'
  },
  
  // NEW: Delivery options
  deliveryOptions: {
    sellerDelivery: {
      type: Boolean,
      default: false
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    pickupAvailable: {
      type: Boolean,
      default: true
    },
    maxDeliveryDistance: {
      type: Number, // in kilometers
      default: null
    }
  },
  
  // NEW: Payment options
  paymentOptions: {
    cash: {
      type: Boolean,
      default: true
    },
    bankTransfer: {
      type: Boolean,
      default: true
    },
    mobileMoney: {
      type: Boolean,
      default: false
    },
    escrow: {
      type: Boolean,
      default: false
    }
  },
  
  sellerVerified: {
    type: Boolean,
    default: false
  },
  verificationWarning: {
    type: Boolean,
    default: function() {
      return !this.sellerVerified;
    }
  },
  
  // NEW: Listing metrics
  viewCount: {
    type: Number,
    default: 0
  },
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // NEW: Featured listing
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // NEW: Last updated timestamp
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // NEW: Expiry for listings
  expiresAt: {
    type: Date,
    default: function() {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months default
      return expiryDate;
    }
  }
});

// Indexes for better query performance
livestockSchema.index({ status: 1, createdAt: -1 });
livestockSchema.index({ seller: 1, status: 1 });
livestockSchema.index({ type: 1, status: 1 });
livestockSchema.index({ 'bidDetails.bidEndTime': 1, status: 1 });
livestockSchema.index({ location: 'text', description: 'text', breed: 'text' });
livestockSchema.index({ coordinates: '2dsphere' });

// Auto-update verification warning when seller status changes
livestockSchema.pre('save', function(next) {
  this.verificationWarning = !this.sellerVerified;
  this.updatedAt = Date.now();
  
  // Auto-update badge based on status and orderType
  if (this.status === 'sold') {
    this.badge = 'Sold';
  } else if (this.status === 'on_bid' || this.orderType === 'bid') {
    this.badge = 'On Bid';
    this.status = 'on_bid';
  } else if (this.status === 'available') {
    this.badge = 'Available';
  }
  
  // Ensure availableQuantity never exceeds quantity
  if (this.availableQuantity > this.quantity) {
    this.availableQuantity = this.quantity;
  }
  
  // Auto-update status when availableQuantity reaches 0
  if (this.availableQuantity <= 0) {
    this.status = 'sold';
    this.badge = 'Sold';
  }
  
  // For bid listings, validate bid end time
  if (this.orderType === 'bid' && this.bidDetails && this.bidDetails.bidEndTime) {
    if (new Date() > this.bidDetails.bidEndTime) {
      this.status = 'available';
      this.badge = 'Available';
    }
  }
  
  next();
});

// Pre-update middleware to handle bid expiry
livestockSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.bidDetails && update.bidDetails.bidEndTime) {
    if (new Date() > update.bidDetails.bidEndTime) {
      update.status = 'available';
      update.badge = 'Available';
    }
  }
  next();
});

// Instance method: Place a bid
livestockSchema.methods.placeBid = async function(userId, bidAmount) {
  if (this.orderType !== 'bid') {
    throw new Error('This listing is not a bid listing');
  }
  
  if (this.status === 'sold') {
    throw new Error('This item is already sold');
  }
  
  if (new Date() > this.bidDetails.bidEndTime) {
    throw new Error('Bidding has ended for this item');
  }
  
  const minimumBid = this.bidDetails.currentBid 
    ? this.bidDetails.currentBid + this.bidDetails.minimumIncrement
    : this.bidDetails.startingBid;
  
  if (bidAmount < minimumBid) {
    throw new Error(`Bid must be at least ${minimumBid}`);
  }
  
  this.bidDetails.currentBid = bidAmount;
  this.bidDetails.currentBidder = userId;
  this.bidDetails.bidHistory.push({
    bidder: userId,
    amount: bidAmount,
    timestamp: new Date()
  });
  
  if (this.bidDetails.reservePrice && bidAmount >= this.bidDetails.reservePrice) {
    this.bidDetails.reserveMet = true;
  }
  
  return await this.save();
};

// Instance method: Reduce quantity when purchased
livestockSchema.methods.reduceQuantity = async function(amount) {
  if (amount > this.availableQuantity) {
    throw new Error(`Only ${this.availableQuantity} available`);
  }
  
  this.availableQuantity -= amount;
  
  if (this.availableQuantity === 0) {
    this.status = 'sold';
    this.badge = 'Sold';
  }
  
  return await this.save();
};

// Static method: Get active listings
livestockSchema.statics.getActiveListings = function() {
  return this.find({
    status: { $in: ['available', 'on_bid'] },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Virtual: Check if bidding is active
livestockSchema.virtual('isBiddingActive').get(function() {
  return this.orderType === 'bid' && 
         this.status === 'on_bid' && 
         this.bidDetails && 
         new Date() < this.bidDetails.bidEndTime;
});

// Virtual: Get remaining bid time
livestockSchema.virtual('remainingBidTime').get(function() {
  if (this.orderType !== 'bid' || !this.bidDetails || !this.bidDetails.bidEndTime) return null;
  const remaining = this.bidDetails.bidEndTime - new Date();
  return Math.max(0, remaining);
});

// Virtual: Get formatted remaining time
livestockSchema.virtual('formattedRemainingTime').get(function() {
  if (!this.remainingBidTime) return 'Expired';
  const days = Math.floor(this.remainingBidTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((this.remainingBidTime % (86400000)) / (1000 * 60 * 60));
  const minutes = Math.floor((this.remainingBidTime % (3600000)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

// Ensure virtuals are included in JSON output
livestockSchema.set('toJSON', { virtuals: true });
livestockSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Livestock', livestockSchema);