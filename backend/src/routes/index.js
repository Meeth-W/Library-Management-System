const express = require('express');
const router = express.Router();
const { getConnectionStatus } = require('../config/database');

// Import route modules
const bookRoutes = require('./bookRoutes');

// Book routes
router.use('/books', bookRoutes);

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Get database connection status
    const dbStatus = getConnectionStatus();
    
    // System uptime in seconds
    const uptime = process.uptime();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // CPU usage (basic)
    const cpuUsage = process.cpuUsage();
    
    res.status(200).json({
      success: true,
      message: 'Library Management API is running smoothly',
      timestamp: new Date().toISOString(),
      system: {
        uptime: {
          seconds: uptime,
          human: formatUptime(uptime)
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
          unit: 'MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          unit: 'microseconds'
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        }
      },
      database: {
        status: dbStatus.state,
        host: dbStatus.host,
        port: dbStatus.port,
        database: dbStatus.database
      },
      api: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    title: 'Library Management API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      books: {
        'GET /books': {
          description: 'Get all books with optional filtering, searching, sorting and pagination',
          parameters: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10, max: 100)',
            sort: 'Sort field (default: -createdAt)',
            search: 'Search in title, author, description, and tags',
            genre: 'Filter by genre',
            year: 'Filter by specific year',
            minYear: 'Filter by minimum year',
            maxYear: 'Filter by maximum year',
            author: 'Filter by author',
            available: 'Filter by availability (true/false)',
            rating: 'Filter by specific rating',
            minRating: 'Filter by minimum rating',
            maxRating: 'Filter by maximum rating',
            language: 'Filter by language',
            publisher: 'Filter by publisher'
          },
          example: '/api/books?page=1&limit=5&search=gatsby&genre=fiction'
        },
        'GET /books/:id': {
          description: 'Get a single book by ID',
          parameters: {
            id: 'Book ID (MongoDB ObjectId)'
          },
          example: '/api/books/60d5ecb74b4b8e2a2c5e8b8a'
        },
        'POST /books': {
          description: 'Create a new book',
          requiredFields: ['title', 'author', 'year'],
          optionalFields: [
            'isbn', 'genre', 'description', 'available', 'pages', 
            'publisher', 'language', 'rating', 'tags'
          ],
          example: {
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            year: 1925,
            genre: 'Fiction',
            description: 'A classic American novel'
          }
        },
        'PUT /books/:id': {
          description: 'Update a book by ID',
          parameters: {
            id: 'Book ID (MongoDB ObjectId)'
          },
          note: 'All fields are optional for updates',
          example: {
            title: 'Updated Title',
            available: false
          }
        },
        'DELETE /books/:id': {
          description: 'Delete a book by ID',
          parameters: {
            id: 'Book ID (MongoDB ObjectId)'
          }
        },
        'GET /books/stats': {
          description: 'Get book statistics',
          returns: {
            general: 'General statistics (total, available, avg rating, etc.)',
            genreDistribution: 'Count of books by genre'
          }
        },
        'GET /books/genre/:genre': {
          description: 'Get books by genre',
          parameters: {
            genre: 'Genre name (case-insensitive)',
            page: 'Page number (optional)',
            limit: 'Items per page (optional)'
          }
        },
        'GET /books/author/:author': {
          description: 'Get books by author',
          parameters: {
            author: 'Author name (case-insensitive)',
            page: 'Page number (optional)',
            limit: 'Items per page (optional)'
          }
        },
        'PATCH /books/:id/toggle-availability': {
          description: 'Toggle book availability status',
          parameters: {
            id: 'Book ID (MongoDB ObjectId)'
          }
        },
        'PATCH /books/:id/tags': {
          description: 'Add a tag to a book',
          parameters: {
            id: 'Book ID (MongoDB ObjectId)'
          },
          body: {
            tag: 'Tag to add'
          }
        },
        'DELETE /books/:id/tags': {
          description: 'Remove a tag from a book',
          parameters: {
            id: 'Book ID (MongoDB ObjectId)'
          },
          body: {
            tag: 'Tag to remove'
          }
        }
      },
      utility: {
        'GET /health': {
          description: 'Check API health status and system information'
        },
        'GET /docs': {
          description: 'Get API documentation'
        }
      }
    },
    responseFormat: {
      success: {
        success: true,
        data: 'Response data',
        message: 'Success message (optional)',
        pagination: 'Pagination info (for list endpoints)'
      },
      error: {
        success: false,
        message: 'Error message',
        errors: 'Validation errors (optional)'
      }
    },
    supportedGenres: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
      'Fantasy', 'Biography', 'History', 'Science', 'Technology',
      'Philosophy', 'Religion', 'Self-Help', 'Business', 'Education',
      'Children', 'Young Adult', 'Classic Literature', 'Poetry', 'Drama',
      'Cookbook', 'Travel', 'Art', 'Music', 'Sports', 'Health',
      'Politics', 'Economics', 'Psychology', 'Sociology', 'Other'
    ]
  });
});

// Version endpoint
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    name: 'Library Management API',
    author: 'Library Management Team',
    license: 'MIT',
    repository: 'https://github.com/Meeth-W/Library-Management-System',
    dependencies: {
      node: process.version,
      platform: process.platform
    },
    timestamp: new Date().toISOString()
  });
});

// Status endpoint (lightweight health check)
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'active',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime())
  });
});

// Helper function to format uptime
function formatUptime(uptimeSeconds) {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

module.exports = router;