// config.js
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse CORS origins from environment variable
const parseCorsOrigins = () => {
  const origins = process.env.CORS_ORIGINS || 'http://localhost:3000';
  return origins.split(',').map(origin => origin.trim());
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
  },
  
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = parseCorsOrigins();
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow if origin matches any allowed origin
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
  
  performance: {
    compression: process.env.ENABLE_COMPRESSION !== 'false',
    cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE, 10) || 86400000,
  },
  
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
};

module.exports = config;