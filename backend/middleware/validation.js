// middleware/validation.js
const { body, validationResult } = require('express-validator');

// If you don't have express-validator installed, run:
// npm install express-validator

const validateLivestock = [
  body('type').isIn(['cattle', 'sheep', 'goat', 'pig', 'chicken', 'horse', 'other'])
    .withMessage('Invalid livestock type'),
  body('breed').notEmpty().trim().withMessage('Breed is required'),
  body('age').isNumeric().withMessage('Age must be a number'),
  body('ageUnit').optional().isIn(['months', 'years']),
  
  // Make price conditional based on orderType
  body('price')
    .if(body('orderType').equals('once_off'))
    .isNumeric()
    .withMessage('Price must be a number for fixed price listings'),
  
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('description').notEmpty().trim().isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('location').notEmpty().trim().withMessage('Location is required'),
  body('weight').optional().isNumeric(),
  body('healthStatus').optional().isIn(['excellent', 'good', 'fair', 'poor']),
  body('vaccinated').optional().isBoolean(),
  body('orderType').optional().isIn(['once_off', 'bid']),
  
  // Bid-specific validations
  body('bidDetails.startingBid')
    .if(body('orderType').equals('bid'))
    .isNumeric()
    .withMessage('Starting bid must be a number')
    .bail()
    .custom(value => value > 0)
    .withMessage('Starting bid must be greater than 0'),
    
  body('bidDetails.bidEndTime')
    .if(body('orderType').equals('bid'))
    .isISO8601()
    .withMessage('Bid end time must be a valid date')
    .bail()
    .custom(value => {
      const endDate = new Date(value);
      return endDate > new Date();
    })
    .withMessage('Bid end time must be in the future'),
    
  body('bidDetails.reservePrice')
    .optional()
    .isNumeric()
    .withMessage('Reserve price must be a number')
    .bail()
    .custom((value, { req }) => {
      if (value && req.body.bidDetails?.startingBid) {
        return value >= req.body.bidDetails.startingBid;
      }
      return true;
    })
    .withMessage('Reserve price cannot be less than starting bid'),
    
  body('bidDetails.minimumIncrement')
    .optional()
    .isNumeric()
    .withMessage('Minimum increment must be a number')
    .bail()
    .custom(value => value > 0)
    .withMessage('Minimum increment must be greater than 0'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

const validateBid = [
  body('bidAmount').isNumeric().withMessage('Bid amount must be a number')
    .bail()
    .custom(value => value > 0)
    .withMessage('Bid amount must be greater than 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

const validatePurchase = [
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('buyoutPrice').optional().isNumeric().withMessage('Buyout price must be a number')
    .bail()
    .custom(value => value > 0)
    .withMessage('Buyout price must be greater than 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

module.exports = {
  validateLivestock,
  validateBid,
  validatePurchase
};