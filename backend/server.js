// server.js
const mongoose = require('mongoose');
const cluster = require('cluster');
const os = require('os');
const { app, config } = require('./app');

// Enable graceful shutdown
let server = null;

/**
 * Connect to MongoDB and start server
 */
const startServer = async () => {
  try {
    // Check if MongoDB URI is provided
    if (!config.mongodb.uri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.error('Please set MONGODB_URI in your Render environment variables');
      process.exit(1);
    }

    // Connect to MongoDB with retry logic
    await connectWithRetry();
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
    // Start server - IMPORTANT: Use 0.0.0.0 for Render
    server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Server running on 0.0.0.0:${config.port}`);
      console.log(`🌍 Environment: ${config.env}`);
      console.log(`📡 PID: ${process.pid}`);
      console.log(`✅ CORS enabled for origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`);
      
      if (config.env === 'development') {
        console.log(`📚 API available at http://localhost:${config.port}`);
      }
    });
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Connect to MongoDB with retry logic
 */
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      return;
    } catch (error) {
      console.log(`MongoDB connection attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Setup graceful shutdown handlers
 */
const setupGracefulShutdown = () => {
  const shutdown = async (signal) => {
    console.log(`\n⚠️ Received ${signal}, starting graceful shutdown...`);
    
    const timeout = setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
    
    try {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log('✅ HTTP server closed');
      }
      
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      }
      
      clearTimeout(timeout);
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
      
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
  
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
};

/**
 * Cluster mode for production
 */
const startWithCluster = () => {
  if (config.env !== 'production' || process.env.DISABLE_CLUSTER === 'true') {
    console.log('📌 Running in single-threaded mode (cluster disabled)');
    return startServer();
  }
  
  const numCPUs = os.cpus().length;
  const workersToFork = Math.min(numCPUs, parseInt(process.env.MAX_WORKERS, 10) || numCPUs);
  
  if (cluster.isMaster) {
    console.log(`🔧 Master ${process.pid} is running`);
    console.log(`💻 Forking ${workersToFork} workers on ${numCPUs} CPUs`);
    
    for (let i = 0; i < workersToFork; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} died with code ${code}, signal ${signal}`);
      console.log('🔄 Starting a new worker...');
      cluster.fork();
    });
    
    cluster.on('error', (error) => {
      console.error('Cluster error:', error);
    });
    
  } else {
    startServer();
  }
};

// Start the application
startWithCluster();

// Export for testing
module.exports = { app, startServer };