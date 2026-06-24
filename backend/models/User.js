const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['seller', 'buyer', 'admin'], // Added 'admin' here
    default: 'buyer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_submitted'],
    default: 'not_submitted'
  },
  verificationDocuments: {
    faceRecognitionImage: String,
    identityDocument: String,
    residentCertificate: String,
    submittedAt: Date,
    verifiedAt: Date,
    rejectionReason: String
  },
  businessName: String,
  businessAddress: String,
  // Add these fields for admin functionality
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  suspendedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if user can list items
userSchema.methods.canListItems = function() {
  // Admins can also list items if needed
  if (this.role === 'admin') return true;
  // Allow if: verified OR verification is pending (documents submitted)
  return this.isVerified === true || this.verificationStatus === 'pending';
};

// Method to get listing restriction message
userSchema.methods.getListingRestrictionMessage = function() {
  if (this.role === 'admin') return null;
  if (this.isVerified) {
    return null;
  }
  if (this.verificationStatus === 'pending') {
    return 'Your verification is pending. Your listings will show a "Seller Unverified" warning badge.';
  }
  if (this.verificationStatus === 'rejected') {
    return 'Your verification was rejected. Please resubmit your documents.';
  }
  return 'Please complete verification to list items.';
};

module.exports = mongoose.model('User', userSchema);