// config/index.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : process.env.NODE_ENV === 'staging' 
    ? '.env.staging' 
    : '.env.development';

dotenv.config({ path: path.join(__dirname, '..', envFile) });

// Fallback to .env if specific env file not found
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || 'localhost',
  
  // Database configuration
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 2,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    }
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
  },
  
  // CORS configuration - FIX THIS SECTION
  cors: {
    origin: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://localhost:5000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
  
  // Performance
  performance: {
    compression: process.env.ENABLE_COMPRESSION === 'true',
    cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE, 10) || 86400000, // 24 hours
  }
};

// Validate required config
const requiredConfig = ['mongodb.uri', 'security.jwtSecret'];
for (const req of requiredConfig) {
  const value = req.split('.').reduce((obj, key) => obj?.[key], config);
  if (!value && config.env !== 'development') {
    console.error(`Missing required configuration: ${req}`);
    process.exit(1);
  }
}

module.exports = config;