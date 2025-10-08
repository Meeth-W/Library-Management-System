const Book = require('../models/Book');
const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/appError');

/**
 * @desc    Get all books with filtering, searching, sorting and pagination
 * @route   GET /api/books
 * @access  Public
 * @params  page, limit, sort, search, genre, year, author, available, rating, language
 */
const getAllBooks = asyncWrapper(async (req, res, next) => {
  // Destructure query parameters with default values
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    genre,
    year,
    author,
    available,
    rating,
    language,
    publisher,
    minYear,
    maxYear,
    minRating,
    maxRating
  } = req.query;

  // Build query object
  let queryObj = {};

  // Search functionality (searches in title, author, and description)
  if (search) {
    queryObj.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Filter by genre
  if (genre) {
    queryObj.genre = { $regex: genre, $options: 'i' };
  }

  // Filter by specific year
  if (year) {
    queryObj.year = parseInt(year);
  }

  // Filter by year range
  if (minYear || maxYear) {
    queryObj.year = {};
    if (minYear) queryObj.year.$gte = parseInt(minYear);
    if (maxYear) queryObj.year.$lte = parseInt(maxYear);
  }

  // Filter by author
  if (author) {
    queryObj.author = { $regex: author, $options: 'i' };
  }

  // Filter by availability
  if (available !== undefined) {
    queryObj.available = available === 'true';
  }

  // Filter by rating
  if (rating) {
    queryObj.rating = parseFloat(rating);
  }

  // Filter by rating range
  if (minRating || maxRating) {
    queryObj.rating = {};
    if (minRating) queryObj.rating.$gte = parseFloat(minRating);
    if (maxRating) queryObj.rating.$lte = parseFloat(maxRating);
  }

  // Filter by language
  if (language) {
    queryObj.language = { $regex: language, $options: 'i' };
  }

  // Filter by publisher
  if (publisher) {
    queryObj.publisher = { $regex: publisher, $options: 'i' };
  }

  // Validate page and limit
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

  // Calculate skip value for pagination
  const skip = (pageNum - 1) * limitNum;

  // Parse sort parameter
  let sortQuery = {};
  if (sort) {
    const sortFields = sort.split(',').join(' ');
    sortQuery = sortFields;
  }

  // Execute query with pagination
  const books = await Book.find(queryObj)
    .sort(sortQuery)
    .limit(limitNum)
    .skip(skip)
    .select('-__v');

  // Get total count for pagination info
  const total = await Book.countDocuments(queryObj);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({
    success: true,
    count: books.length,
    total,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null
    },
    data: books
  });
});

/**
 * @desc    Get single book by ID
 * @route   GET /api/books/:id
 * @access  Public
 */
const getBook = asyncWrapper(async (req, res, next) => {
  const book = await Book.findById(req.params.id).select('-__v');

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    success: true,
    data: book
  });
});

/**
 * @desc    Create new book
 * @route   POST /api/books
 * @access  Public
 */
const createBook = asyncWrapper(async (req, res, next) => {
  // Add metadata
  req.body.addedBy = req.body.addedBy || 'api_user';

  const book = await Book.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Book created successfully',
    data: book
  });
});

/**
 * @desc    Update book by ID
 * @route   PUT /api/books/:id
 * @access  Public
 */
const updateBook = asyncWrapper(async (req, res, next) => {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).select('-__v');

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Book updated successfully',
    data: book
  });
});

/**
 * @desc    Delete book by ID
 * @route   DELETE /api/books/:id
 * @access  Public
 */
const deleteBook = asyncWrapper(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Book deleted successfully',
    data: {}
  });
});

/**
 * @desc    Get books by genre
 * @route   GET /api/books/genre/:genre
 * @access  Public
 */
const getBooksByGenre = asyncWrapper(async (req, res, next) => {
  const { genre } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const books = await Book.find({ 
    genre: { $regex: genre, $options: 'i' } 
  })
    .sort({ title: 1 })
    .limit(limitNum)
    .skip(skip)
    .select('-__v');

  const total = await Book.countDocuments({ 
    genre: { $regex: genre, $options: 'i' } 
  });

  res.status(200).json({
    success: true,
    count: books.length,
    total,
    genre: genre,
    data: books
  });
});

/**
 * @desc    Get books by author
 * @route   GET /api/books/author/:author
 * @access  Public
 */
const getBooksByAuthor = asyncWrapper(async (req, res, next) => {
  const { author } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const books = await Book.find({ 
    author: { $regex: author, $options: 'i' } 
  })
    .sort({ year: -1 })
    .limit(limitNum)
    .skip(skip)
    .select('-__v');

  const total = await Book.countDocuments({ 
    author: { $regex: author, $options: 'i' } 
  });

  res.status(200).json({
    success: true,
    count: books.length,
    total,
    author: author,
    data: books
  });
});

/**
 * @desc    Toggle book availability
 * @route   PATCH /api/books/:id/toggle-availability
 * @access  Public
 */
const toggleBookAvailability = asyncWrapper(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  await book.toggleAvailability();

  res.status(200).json({
    success: true,
    message: `Book availability toggled to ${book.available ? 'available' : 'unavailable'}`,
    data: book
  });
});

/**
 * @desc    Add tag to book
 * @route   PATCH /api/books/:id/tags
 * @access  Public
 */
const addTagToBook = asyncWrapper(async (req, res, next) => {
  const { tag } = req.body;

  if (!tag) {
    return next(new AppError('Tag is required', 400));
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  await book.addTag(tag);

  res.status(200).json({
    success: true,
    message: 'Tag added successfully',
    data: book
  });
});

/**
 * @desc    Remove tag from book
 * @route   DELETE /api/books/:id/tags
 * @access  Public
 */
const removeTagFromBook = asyncWrapper(async (req, res, next) => {
  const { tag } = req.body;

  if (!tag) {
    return next(new AppError('Tag is required', 400));
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  await book.removeTag(tag);

  res.status(200).json({
    success: true,
    message: 'Tag removed successfully',
    data: book
  });
});

/**
 * @desc    Get book statistics
 * @route   GET /api/books/stats
 * @access  Public
 */
const getBookStats = asyncWrapper(async (req, res, next) => {
  const stats = await Book.aggregate([
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        availableBooks: {
          $sum: { $cond: [{ $eq: ['$available', true] }, 1, 0] }
        },
        checkedOutBooks: {
          $sum: { $cond: [{ $eq: ['$available', false] }, 1, 0] }
        },
        avgRating: { $avg: '$rating' },
        oldestBook: { $min: '$year' },
        newestBook: { $max: '$year' },
        avgPages: { $avg: '$pages' }
      }
    }
  ]);

  // Get genre distribution
  const genreStats = await Book.aggregate([
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      general: stats[0] || {
        totalBooks: 0,
        availableBooks: 0,
        checkedOutBooks: 0,
        avgRating: 0,
        oldestBook: null,
        newestBook: null,
        avgPages: 0
      },
      genreDistribution: genreStats
    }
  });
});

module.exports = {
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
};