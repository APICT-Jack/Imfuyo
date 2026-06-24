// middleware/loggingMiddleware.js
const fs = require('fs');
const path = require('path');
const os = require('os');

// Create logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log streams
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'errors.log'),
  { flags: 'a' }
);

const requestLogStream = fs.createWriteStream(
  path.join(logsDir, 'requests.log'),
  { flags: 'a' }
);

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capture original end method
  const originalEnd = res.end;
  const chunks = [];
  
  // Override end method to log after response
  res.end = function(chunk) {
    if (chunk) chunks.push(chunk);
    const responseTime = Date.now() - start;
    
    // Log request details
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id || 'anonymous',
      body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
      query: req.query,
      params: req.params
    };
    
    // Write to log file
    requestLogStream.write(JSON.stringify(logEntry) + '\n');
    
    // In development, also log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`);
    }
    
    originalEnd.apply(res, arguments);
  };
  
  next();
};

/**
 * Performance logging middleware
 */
const performanceLogger = (req, res, next) => {
  const startMemory = process.memoryUsage();
  const startCpu = process.cpuUsage();
  const startTime = Date.now();
  
  // Store start time in request for later use
  req.startTime = startTime;
  
  // Override end method for performance metrics
  const originalEnd = res.end;
  res.end = function(chunk) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(startCpu);
    
    // Log performance metrics for slow requests (> 1 second)
    if (duration > 1000) {
      const perfEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        memoryUsage: {
          heapUsed: formatBytes(endMemory.heapUsed - startMemory.heapUsed),
          heapTotal: formatBytes(endMemory.heapTotal),
          rss: formatBytes(endMemory.rss)
        },
        cpuUsage: {
          user: `${(endCpu.user / 1000).toFixed(2)}ms`,
          system: `${(endCpu.system / 1000).toFixed(2)}ms`
        },
        statusCode: res.statusCode
      };
      
      // Write to error log as warning
      errorLogStream.write(JSON.stringify({ level: 'warn', ...perfEntry }) + '\n');
      
      // Also log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ Slow request: ${req.method} ${req.url} took ${duration}ms`);
      }
    }
    
    originalEnd.apply(res, arguments);
  };
  
  next();
};

/**
 * Sanitize body for logging (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body) return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
      body: sanitizeBody(req.body),
      query: req.query,
      params: req.params
    },
    server: {
      hostname: os.hostname(),
      pid: process.pid,
      platform: os.platform(),
      memory: process.memoryUsage()
    }
  };
  
  // Write to error log file
  errorLogStream.write(JSON.stringify(errorEntry) + '\n');
  
  // Also log to console
  console.error('Error:', err.message);
  
  next(err);
};

module.exports = {
  requestLogger,
  performanceLogger,
  errorLogger
};