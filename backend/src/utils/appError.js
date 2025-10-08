/**
 * Custom AppError class for operational errors
 * Extends the built-in Error class to include statusCode and isOperational properties
 */
class AppError extends Error {
  /**
   * Create an operational error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace (excluding this constructor from it)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;