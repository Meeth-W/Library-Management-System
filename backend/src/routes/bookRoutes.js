const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getAllBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getBooksByGenre,
  getBooksByAuthor,
  toggleBookAvailability,
  addTagToBook,
  removeTagFromBook,
  getBookStats
} = require('../controllers/bookController');

// Import middleware
const { 
  validateBook, 
  validateBookUpdate,
  validateObjectId,
  validatePagination 
} = require('../middleware/validation');

// Book statistics route (must be before /:id routes)
router.get('/stats', getBookStats);

// Genre-specific routes (must be before /:id routes)
router.get('/genre/:genre', getBooksByGenre);

// Author-specific routes (must be before /:id routes)
router.get('/author/:author', getBooksByAuthor);

// Main CRUD routes
router.route('/')
  .get(validatePagination, getAllBooks)
  .post(validateBook, createBook);

router.route('/:id')
  .get(validateObjectId, getBook)
  .put(validateObjectId, validateBookUpdate, updateBook)
  .delete(validateObjectId, deleteBook);

// Additional functionality routes
router.patch('/:id/toggle-availability', 
  validateObjectId, 
  toggleBookAvailability
);

router.route('/:id/tags')
  .patch(validateObjectId, addTagToBook)
  .delete(validateObjectId, removeTagFromBook);

module.exports = router;