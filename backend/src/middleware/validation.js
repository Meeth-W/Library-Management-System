const Joi = require('joi');
const mongoose = require('mongoose');

// Current year for validation
const currentYear = new Date().getFullYear();

// Book validation schema for creation
const bookCreateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  author: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.empty': 'Author is required',
      'string.min': 'Author must be at least 1 character long',
      'string.max': 'Author cannot exceed 100 characters',
      'any.required': 'Author is required'
    }),
  
  year: Joi.number()
    .integer()
    .min(1000)
    .max(currentYear)
    .required()
    .messages({
      'number.base': 'Year must be a number',
      'number.integer': 'Year must be an integer',
      'number.min': 'Year must be at least 1000',
      'number.max': `Year cannot exceed ${currentYear}`,
      'any.required': 'Publication year is required'
    }),
  
  isbn: Joi.string()
    .trim()
    .pattern(/^(?:\d{9}[\dX]|\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-[\dX]|\d{1,5}-\d{1,7}-\d{1,7}-\d{1,7}-\d{1,7})$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please enter a valid ISBN-10 or ISBN-13 format'
    }),
  
  genre: Joi.string()
    .valid(
      'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
      'Fantasy', 'Biography', 'History', 'Science', 'Technology',
      'Philosophy', 'Religion', 'Self-Help', 'Business', 'Education',
      'Children', 'Young Adult', 'Classic Literature', 'Poetry', 'Drama',
      'Cookbook', 'Travel', 'Art', 'Music', 'Sports', 'Health',
      'Politics', 'Economics', 'Psychology', 'Sociology', 'Other'
    )
    .optional()
    .messages({
      'any.only': 'Genre must be one of the predefined categories'
    }),
  
  description: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  available: Joi.boolean()
    .optional()
    .default(true),
  
  pages: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .optional()
    .messages({
      'number.base': 'Pages must be a number',
      'number.integer': 'Pages must be an integer',
      'number.min': 'Pages must be at least 1',
      'number.max': 'Pages cannot exceed 10000'
    }),
  
  publisher: Joi.string()
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.max': 'Publisher name cannot exceed 100 characters'
    }),
  
  language: Joi.string()
    .max(50)
    .trim()
    .optional()
    .default('English')
    .messages({
      'string.max': 'Language cannot exceed 50 characters'
    }),
  
  rating: Joi.number()
    .min(0)
    .max(5)
    .optional()
    .messages({
      'number.base': 'Rating must be a number',
      'number.min': 'Rating cannot be less than 0',
      'number.max': 'Rating cannot be more than 5'
    }),
  
  tags: Joi.array()
    .items(
      Joi.string()
        .trim()
        .max(30)
        .messages({
          'string.max': 'Each tag cannot exceed 30 characters'
        })
    )
    .optional(),
  
  addedBy: Joi.string()
    .max(50)
    .trim()
    .optional()
    .default('api_user')
});

// Book validation schema for updates (all fields optional)
const bookUpdateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .optional(),
  
  author: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  
  year: Joi.number()
    .integer()
    .min(1000)
    .max(currentYear)
    .optional(),
  
  isbn: Joi.string()
    .trim()
    .pattern(/^(?:\d{9}[\dX]|\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-[\dX]|\d{1,5}-\d{1,7}-\d{1,7}-\d{1,7}-\d{1,7})$/)
    .optional(),
  
  genre: Joi.string()
    .valid(
      'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
      'Fantasy', 'Biography', 'History', 'Science', 'Technology',
      'Philosophy', 'Religion', 'Self-Help', 'Business', 'Education',
      'Children', 'Young Adult', 'Classic Literature', 'Poetry', 'Drama',
      'Cookbook', 'Travel', 'Art', 'Music', 'Sports', 'Health',
      'Politics', 'Economics', 'Psychology', 'Sociology', 'Other'
    )
    .optional(),
  
  description: Joi.string()
    .max(1000)
    .trim()
    .optional(),
  
  available: Joi.boolean()
    .optional(),
  
  pages: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .optional(),
  
  publisher: Joi.string()
    .max(100)
    .trim()
    .optional(),
  
  language: Joi.string()
    .max(50)
    .trim()
    .optional(),
  
  rating: Joi.number()
    .min(0)
    .max(5)
    .optional(),
  
  tags: Joi.array()
    .items(
      Joi.string()
        .trim()
        .max(30)
    )
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Pagination validation schema
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  sort: Joi.string()
    .optional()
    .default('-createdAt'),
  
  search: Joi.string()
    .trim()
    .optional(),
  
  genre: Joi.string()
    .trim()
    .optional(),
  
  year: Joi.number()
    .integer()
    .min(1000)
    .max(currentYear)
    .optional(),
  
  author: Joi.string()
    .trim()
    .optional(),
  
  available: Joi.string()
    .valid('true', 'false')
    .optional(),
  
  rating: Joi.number()
    .min(0)
    .max(5)
    .optional(),
  
  language: Joi.string()
    .trim()
    .optional(),
  
  publisher: Joi.string()
    .trim()
    .optional(),
  
  minYear: Joi.number()
    .integer()
    .min(1000)
    .max(currentYear)
    .optional(),
  
  maxYear: Joi.number()
    .integer()
    .min(1000)
    .max(currentYear)
    .optional(),
  
  minRating: Joi.number()
    .min(0)
    .max(5)
    .optional(),
  
  maxRating: Joi.number()
    .min(0)
    .max(5)
    .optional()
});

// Tag validation schema
const tagSchema = Joi.object({
  tag: Joi.string()
    .trim()
    .min(1)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Tag is required',
      'string.min': 'Tag must be at least 1 character long',
      'string.max': 'Tag cannot exceed 30 characters',
      'any.required': 'Tag is required'
    })
});

// Validation middleware functions
const validateBook = (req, res, next) => {
  const { error, value } = bookCreateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  req.body = value; // Use validated and sanitized data
  next();
};

const validateBookUpdate = (req, res, next) => {
  const { error, value } = bookUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  req.body = value; // Use validated and sanitized data
  next();
};

const validatePagination = (req, res, next) => {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: false // Allow other query parameters
  });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: errorMessages
    });
  }
  
  // Update req.query with validated values
  Object.assign(req.query, value);
  next();
};

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID format'
    });
  }
  
  next();
};

const validateTag = (req, res, next) => {
  const { error, value } = tagSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  req.body = value;
  next();
};

// Custom validation for year range
const validateYearRange = (req, res, next) => {
  const { minYear, maxYear } = req.query;
  
  if (minYear && maxYear && parseInt(minYear) > parseInt(maxYear)) {
    return res.status(400).json({
      success: false,
      message: 'Minimum year cannot be greater than maximum year'
    });
  }
  
  next();
};

// Custom validation for rating range
const validateRatingRange = (req, res, next) => {
  const { minRating, maxRating } = req.query;
  
  if (minRating && maxRating && parseFloat(minRating) > parseFloat(maxRating)) {
    return res.status(400).json({
      success: false,
      message: 'Minimum rating cannot be greater than maximum rating'
    });
  }
  
  next();
};

module.exports = {
  validateBook,
  validateBookUpdate,
  validatePagination,
  validateObjectId,
  validateTag,
  validateYearRange,
  validateRatingRange,
  bookCreateSchema,
  bookUpdateSchema,
  paginationSchema,
  tagSchema
};