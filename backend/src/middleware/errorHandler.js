const AppError = require('../utils/appError');

/**
 * Global error handling middleware
 * This middleware catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  // Create a copy of the error
  let error = { ...err };
  error.message = err.message;

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
    console.error('Error Details:', {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode || 500,
      isOperational: err.isOperational
    });
  } else {
    // Log only non-operational errors in production
    if (!err.isOperational) {
      console.error('Programming Error:', err);
    }
  }

  // Mongoose bad ObjectId error
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new AppError(message, 400);
  }

  // Mongoose duplicate field error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = errors.join('. ');
    error = new AppError(message, 400);
  }

  // JWT authentication error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again.';
    error = new AppError(message, 401);
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please login again.';
    error = new AppError(message, 401);
  }

  // Multer file upload error
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = new AppError(message, 400);
  }

  // MongoDB connection error
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    const message = 'Database connection error. Please try again later.';
    error = new AppError(message, 500);
  }

  // Rate limiting error
  if (err.type === 'entity.too.large') {
    const message = 'Request entity too large';
    error = new AppError(message, 413);
  }

  // Syntax error in JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'Invalid JSON format';
    error = new AppError(message, 400);
  }

  // Prepare response object
  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: err.name,
      stack: err.stack,
      statusCode: error.statusCode || 500
    };
  }

  // Add validation errors if they exist
  if (error.errors && Array.isArray(error.errors)) {
    response.errors = error.errors;
  }

  // Add request ID if available (useful for tracking)
  if (req.id) {
    response.requestId = req.id;
  }

  // Send error response
  res.status(error.statusCode || 500).json(response);
};

/**
 * Middleware to handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  const error = new AppError(message, 404);
  next(error);
};

/**
 * Async error handler wrapper
 * Wraps async functions to catch any errors and pass them to error middleware
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Development error response
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      isOperational: err.isOperational
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Production error response
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle specific error types
 */
const handleSpecificErrors = (err) => {
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue)[0];
    const message = `${duplicateField} already exists`;
    return new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
  }

  return err;
};

/**
 * Middleware to log all requests (useful for debugging)
 */
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${req.ip}`);
  }
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  sendErrorDev,
  sendErrorProd,
  handleSpecificErrors,
  requestLogger
};