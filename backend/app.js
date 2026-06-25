// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger, performanceLogger } = require('./middleware/loggingMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const livestockRoutes = require('./routes/livestockRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ==================== CORS CONFIGURATION (MUST BE FIRST) ====================
console.log('=== CORS Configuration ===');
console.log('CORS Origins:', process.env.CORS_ORIGINS || 'http://localhost:3000');

// Apply CORS middleware
app.use(cors(config.cors));

// Handle preflight requests explicitly
app.options('*', cors(config.cors));

// Add manual CORS headers as a backup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin && process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ==================== SECURITY MIDDLEWARE ====================

// Helmet - Security headers (with CORS-friendly settings)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression - Gzip responses
if (config.performance.compression) {
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['page', 'limit', 'sort', 'minPrice', 'maxPrice', 'age']
}));

// ==================== LOGGING MIDDLEWARE ====================

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Morgan logging with different formats based on environment
if (config.env === 'production') {
  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  app.use(morgan('dev'));
}

// Custom request/performance logging
app.use(requestLogger);
if (config.env === 'production') {
  app.use(performanceLogger);
}

// ==================== RATE LIMITING ====================

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.path.startsWith('/api/admin') && req.user?.role === 'admin';
  }
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
});

// Strict limiter for bid/purchase endpoints
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many transaction attempts, please slow down.',
    code: 'TRANSACTION_RATE_LIMIT_EXCEEDED'
  }
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Upload limit reached, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

// Apply rate limiters
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/livestock/:id/bid', transactionLimiter);
app.use('/api/livestock/:id/purchase', transactionLimiter);
app.use('/api/upload', uploadLimiter);

// ==================== STATIC FILES ====================

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: config.performance.cacheMaxAge,
  etag: true,
  lastModified: true,
}));

// ==================== HEALTH CHECK ENDPOINTS ====================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    mongodb: {
      state: mongoose.STATES[mongoose.connection.readyState],
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    version: process.version,
    platform: process.platform
  };
  
  if (mongoose.connection.readyState !== 1) {
    health.status = 'unhealthy';
    health.mongodb.error = 'MongoDB not connected';
    return res.status(503).json(health);
  }
  
  res.status(200).json(health);
});

// ==================== ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/livestock', livestockRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', statsRoutes);
app.use('/api/admin', adminRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'IMFuyo API',
    version: '1.0.0',
    environment: config.env,
    status: 'running',
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    message: 'API documentation available at /api-docs',
    endpoints: {
      auth: '/api/auth',
      livestock: '/api/livestock',
      vehicles: '/api/vehicles',
      upload: '/api/upload',
      stats: '/api/stats'
    }
  });
});

// ==================== ERROR HANDLING ====================

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app, config };