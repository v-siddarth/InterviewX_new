const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('./config');

// MongoDB connection options
const mongoOptions = {
  // Connection options
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  
  // Buffering options
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0, // Disable mongoose buffering
  
  // Authentication options (if needed)
  // authSource: 'admin',
  
  // SSL options (for production)
  // ssl: config.isProduction(),
  // sslValidate: config.isProduction(),
};

// Connection state tracking
let isConnected = false;

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Get database URL
    const mongoUri = config.getDatabaseUrl();
    
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@') });
    
    const conn = await mongoose.connect(mongoUri, mongoOptions);
    
    isConnected = true;
    
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`, {
      host: conn.connection.host,
      port: conn.connection.port,
      database: conn.connection.name,
      readyState: conn.connection.readyState
    });
    
    return conn;
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    
    // Exit process with failure
    process.exit(1);
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
      logger.info('📴 MongoDB Disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

// Check connection status
const isConnectedToDB = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Get connection status
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

// Connection event handlers
mongoose.connection.on('connecting', () => {
  logger.info('🔄 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('✅ MongoDB connected successfully');
});

mongoose.connection.on('open', () => {
  logger.info('📂 MongoDB connection opened');
});

mongoose.connection.on('disconnecting', () => {
  logger.info('🔄 Disconnecting from MongoDB...');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('📴 MongoDB disconnected');
});

mongoose.connection.on('close', () => {
  isConnected = false;
  logger.info('🔒 MongoDB connection closed');
});

mongoose.connection.on('error', (error) => {
  isConnected = false;
  logger.error('❌ MongoDB connection error:', error);
  
  // Attempt to reconnect after 5 seconds
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('🔄 MongoDB reconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  logger.info('📴 SIGINT received, closing MongoDB connection...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('📴 SIGTERM received, closing MongoDB connection...');
  await disconnectDB();
  process.exit(0);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    logger.info('🔄 Graceful shutdown initiated...');
    await disconnectDB();
    logger.info('✅ Graceful shutdown completed');
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
  }
};

// Database health check
const healthCheck = async () => {
  try {
    if (!isConnectedToDB()) {
      throw new Error('Database not connected');
    }
    
    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      connection: getConnectionStatus(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connection: getConnectionStatus(),
      timestamp: new Date().toISOString()
    };
  }
};

// Database statistics
const getStats = async () => {
  try {
    if (!isConnectedToDB()) {
      throw new Error('Database not connected');
    }
    
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    return {
      database: mongoose.connection.name,
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    return null;
  }
};

// Create database indexes
const createIndexes = async () => {
  try {
    logger.info('🔍 Creating database indexes...');
    
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ role: 1 });
    
    // Interview indexes
    await mongoose.connection.collection('interviews').createIndex({ interviewer: 1 });
    await mongoose.connection.collection('interviews').createIndex({ candidate: 1 });
    await mongoose.connection.collection('interviews').createIndex({ status: 1 });
    await mongoose.connection.collection('interviews').createIndex({ scheduledAt: 1 });
    await mongoose.connection.collection('interviews').createIndex({ createdAt: -1 });
    
    // Question indexes
    await mongoose.connection.collection('questions').createIndex({ category: 1 });
    await mongoose.connection.collection('questions').createIndex({ difficulty: 1 });
    await mongoose.connection.collection('questions').createIndex({ type: 1 });
    
    // Evaluation indexes
    await mongoose.connection.collection('evaluations').createIndex({ interview: 1 }, { unique: true });
    await mongoose.connection.collection('evaluations').createIndex({ candidate: 1 });
    await mongoose.connection.collection('evaluations').createIndex({ overallScore: 1 });
    
    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    if (error.code === 11000) {
      logger.info('ℹ️  Indexes already exist, skipping creation');
    } else {
      logger.error('❌ Error creating indexes:', error);
    }
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnectedToDB,
  getConnectionStatus,
  healthCheck,
  getStats,
  createIndexes,
  gracefulShutdown
};