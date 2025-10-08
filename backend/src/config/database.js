const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    // Determine which database URI to use
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/library_management_test'
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management';

    // Connection options
    const options = {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
    //   bufferMaxEntries: 0 // Disable mongoose buffering
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🗄️  Database: ${conn.connection.db.databaseName}`);
    console.log(`🌐 Host: ${conn.connection.host}:${conn.connection.port}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed through app termination');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error.message);
      }
    });

    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Log additional error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // Exit process with failure code
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
    throw error;
  }
};

/**
 * Clear all data from database (useful for testing)
 */
const clearDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    await Promise.all(
      Object.values(collections).map(collection => collection.deleteMany({}))
    );
    
    console.log('🧹 Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
};

/**
 * Get database connection status
 */
const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[state],
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.db?.databaseName,
    uptime: process.uptime()
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDB,
  getConnectionStatus
};