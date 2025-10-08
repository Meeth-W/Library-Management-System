const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const app = require('./src/app');
const { connectDB } = require('./src/config/database');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Library Management API is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server URL: http://localhost:${PORT}
📚 API Base URL: http://localhost:${PORT}/api
🔍 Health Check: http://localhost:${PORT}/api/health
📖 API Info: http://localhost:${PORT}/info
⏰ Started at: ${new Date().toISOString()}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Promise:', promise);
  
  // Close server gracefully
  server.close(() => {
    console.log('Process terminated! 🔻');
    process.exit(1);
  });
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated! 🔻');
    process.exit(0);
  });
});

// Handle SIGINT gracefully (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n👋 SIGINT RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated! 🔻');
    process.exit(0);
  });
});

module.exports = server;