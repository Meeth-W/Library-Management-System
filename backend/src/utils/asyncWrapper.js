/**
 * Async wrapper utility to catch errors in async route handlers
 * This eliminates the need for try-catch blocks in every async route handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncWrapper = (fn) => {
  return (req, res, next) => {
    // Execute the function and catch any errors
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncWrapper;