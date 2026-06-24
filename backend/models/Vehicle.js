const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['truck', 'trailer', 'van', 'pickup', 'other']
  },
  model: {
    type: String,
    required: true
  },
  capacity: {
    type: String,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  pricePerKm: {
    type: Number
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  features: [String],
  location: {
    type: String,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  ownerVerified: {
    type: Boolean,
    default: false
  },
  verificationWarning: {
    type: Boolean,
    default: function() {
      return !this.ownerVerified;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

vehicleSchema.pre('save', function(next) {
  this.verificationWarning = !this.ownerVerified;
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);