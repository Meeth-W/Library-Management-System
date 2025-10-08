const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');


/**
 * Create a rate limiter with custom configuration
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests per window
 * @param {string} message - Custom error message
 * @returns {Function} Express rate limiting middleware
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = null) => {
  return rateLimit({
    windowMs,
    max,
    message: message || {
      success: false,
      message: `Too many requests from this IP, please try again after ${Math.ceil(windowMs / (1000 * 60))} minutes.`,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      console.log(`Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
      res.status(options.statusCode).json(options.message);
    },
    skip: (req, res) => {
      // Skip rate limiting for health checks in development
      if (process.env.NODE_ENV === 'development' && req.path === '/api/health') {
        return true;
      }
      return false;
    },
    keyGenerator: (req, res) => {
      return ipKeyGenerator(req);
    }
  });
};

// General rate limiter for all API routes
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  {
    success: false,
    message: 'Too many requests from this IP, please try again in 15 minutes.',
    type: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 15 minutes in seconds
  }
);

// Strict rate limiter for write operations (POST, PUT, DELETE)
const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  20, // limit each IP to 20 requests per windowMs
  {
    success: false,
    message: 'Too many write operations from this IP, please try again in 15 minutes.',
    type: 'WRITE_LIMIT_EXCEEDED',
    retryAfter: 900
  }
);

// Very strict rate limiter for creation operations
const createLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  5, // limit each IP to 5 requests per minute
  {
    success: false,
    message: 'Too many creation requests, please try again in 1 minute.',
    type: 'CREATE_LIMIT_EXCEEDED',
    retryAfter: 60
  }
);

// Search rate limiter (more generous for read operations)
const searchLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  30, // limit each IP to 30 searches per minute
  {
    success: false,
    message: 'Too many search requests, please try again in 1 minute.',
    type: 'SEARCH_LIMIT_EXCEEDED',
    retryAfter: 60
  }
);

// Auth rate limiter (for future authentication endpoints)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 login attempts per windowMs
  {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    type: 'AUTH_LIMIT_EXCEEDED',
    retryAfter: 900
  }
);

// Progressive rate limiter that increases restrictions based on request count
const progressiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // Progressive limits based on endpoint
    if (req.method === 'GET') {
      return 200; // More generous for read operations
    } else if (req.method === 'POST') {
      return 30;  // Moderate for creation
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      return 50;  // Moderate for updates
    } else if (req.method === 'DELETE') {
      return 10;  // Strict for deletion
    }
    return 100; // Default
  },
  message: {
    success: false,
    message: 'Rate limit exceeded. Different limits apply to different operations.',
    limits: {
      GET: '200 requests per 15 minutes',
      POST: '30 requests per 15 minutes',
      PUT: '50 requests per 15 minutes',
      DELETE: '10 requests per 15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for specific routes
const routeSpecificLimiter = {
  // Health check - very generous
  health: createRateLimiter(1 * 60 * 1000, 60, {
    success: false,
    message: 'Too many health check requests, please wait 1 minute.'
  }),
  
  // Book statistics - moderate
  stats: createRateLimiter(5 * 60 * 1000, 30, {
    success: false,
    message: 'Too many stats requests, please try again in 5 minutes.'
  }),
  
  // Bulk operations - strict
  bulk: createRateLimiter(15 * 60 * 1000, 5, {
    success: false,
    message: 'Too many bulk operations, please try again in 15 minutes.'
  })
};

// Middleware to apply different rate limits based on user type (for future use)
const dynamicRateLimiter = (req, res, next) => {
  // This could be expanded to check user roles/types from JWT tokens
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  const isApiKey = req.headers['x-api-key'];
  
  if (isAdmin) {
    // Admins get higher limits
    return createRateLimiter(15 * 60 * 1000, 1000)(req, res, next);
  } else if (isApiKey) {
    // API key users get moderate limits
    return createRateLimiter(15 * 60 * 1000, 500)(req, res, next);
  } else {
    // Regular users get standard limits
    return generalLimiter(req, res, next);
  }
};

// Skip rate limiting in test environment
const skipInTest = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  return generalLimiter(req, res, next);
};

// Rate limiter with custom store (for production with Redis)
const createRedisRateLimiter = (redisClient) => {
  const RedisStore = require('rate-limit-redis');
  
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:library-api:'
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    }
  });
};

module.exports = {
  createRateLimiter,
  generalLimiter,
  strictLimiter,
  createLimiter,
  searchLimiter,
  authLimiter,
  progressiveLimiter,
  routeSpecificLimiter,
  dynamicRateLimiter,
  skipInTest,
  createRedisRateLimiter
};