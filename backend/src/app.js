const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Rate limiting
app.use('/api', generalLimiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request timestamp middleware
app.use((req, res, next) => {
  req.timestamp = new Date().toISOString();
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Library Management API',
    version: '1.0.0',
    timestamp: req.timestamp,
    environment: process.env.NODE_ENV || 'development',
    documentation: {
      health: '/api/health',
      books: '/api/books'
    }
  });
});

// API info endpoint
app.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    api: {
      name: 'Library Management API',
      version: '1.0.0',
      description: 'RESTful API for managing library books',
      author: 'Library Management Team',
      license: 'MIT'
    },
    endpoints: {
      books: {
        'GET /api/books': 'Get all books with optional filtering and pagination',
        'GET /api/books/:id': 'Get a single book by ID',
        'POST /api/books': 'Create a new book',
        'PUT /api/books/:id': 'Update a book by ID',
        'DELETE /api/books/:id': 'Delete a book by ID'
      },
      utility: {
        'GET /api/health': 'Check API health status',
        'GET /info': 'Get API information'
      }
    },
    timestamp: req.timestamp
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: req.timestamp,
    suggestion: 'Check /info for available endpoints'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;