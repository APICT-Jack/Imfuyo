const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided. Authorization denied.' 
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      // Attach user info to request
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        businessName: user.businessName,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        phone: user.phone,
        location: user.location,
        canListItems: user.canListItems ? user.canListItems() : (user.role === 'seller')
      };
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication' 
    });
  }
};

/**
 * Optional authentication middleware
 * Doesn't require token, but attaches user if present
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        req.user = {
          id: user._id,
          email: user.email,
          name: user.name,
          businessName: user.businessName,
          role: user.role,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          phone: user.phone,
          location: user.location,
          canListItems: user.canListItems ? user.canListItems() : (user.role === 'seller')
        };
      } else {
        req.user = null;
      }
      next();
    } catch (jwtError) {
      // If token is invalid, still allow access but without user
      req.user = null;
      next();
    }
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Admin only middleware
 * Requires user to have admin role
 */
// Update the adminOnly middleware (already exists, but ensure it's there)
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

/**
 * Seller only middleware
 * Requires user to have seller role (verified or pending)
 */
const sellerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'seller') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Seller account required.' 
    });
  }
  next();
};

/**
 * Seller can list middleware
 * Allows sellers who are verified OR have pending verification
 */
const sellerCanList = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'seller') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Seller account required to list items.' 
    });
  }
  
  // Allow listing if verified OR verification is pending
  if (!req.user.isVerified && req.user.verificationStatus !== 'pending') {
    return res.status(403).json({ 
      success: false,
      message: 'Please submit verification documents before listing items.',
      verificationRequired: true,
      redirectTo: '/seller/verify'
    });
  }
  
  next();
};

/**
 * Verified seller only middleware
 * Requires seller to be fully verified
 */
const verifiedSellerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'seller' || !req.user.isVerified) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Verified seller account required.' 
    });
  }
  next();
};

/**
 * Buyer only middleware
 * Requires user to have buyer role
 */
const buyerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Buyer account required.' 
    });
  }
  next();
};

/**
 * Resource owner middleware
 * Checks if the authenticated user owns the resource
 */
const isResourceOwner = (Model) => async (req, res, next) => {
  try {
    const resource = await Model.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ 
        success: false,
        message: 'Resource not found' 
      });
    }
    
    if (resource.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You do not own this resource.' 
      });
    }
    
    req.resource = resource;
    next();
  } catch (error) {
    console.error('Resource owner check error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error checking resource ownership' 
    });
  }
};

/**
 * Rate limiting middleware (basic implementation)
 * Can be enhanced with Redis for production
 */
const rateLimit = new Map();

const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!rateLimit.has(userId)) {
      rateLimit.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userRate = rateLimit.get(userId);
    
    if (now > userRate.resetTime) {
      rateLimit.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRate.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please try again in ${Math.ceil((userRate.resetTime - now) / 1000)} seconds.`
      });
    }
    
    userRate.count++;
    next();
  };
};

/**
 * Permission checker middleware
 * Checks if user has specific permission
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    const permissions = {
      'list:create': ['seller', 'admin'],
      'list:update': ['seller', 'admin'],
      'list:delete': ['seller', 'admin'],
      'user:manage': ['admin'],
      'verification:approve': ['admin'],
      'bid:place': ['buyer', 'seller'], // Sellers can also bid on others' listings
      'purchase:make': ['buyer', 'seller']
    };
    
    const allowedRoles = permissions[permission];
    
    if (!allowedRoles) {
      return res.status(403).json({
        success: false,
        message: 'Unknown permission requested'
      });
    }
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${permission}`
      });
    }
    
    next();
  };
};

module.exports = { 
  authMiddleware,
  optionalAuthMiddleware,
  adminOnly,
  sellerOnly,
  sellerCanList,
  verifiedSellerOnly,
  buyerOnly,
  isResourceOwner,
  rateLimiter,
  hasPermission
};