
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  auth: createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later.'),
  api: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later.'),
  strict: createRateLimiter(15 * 60 * 1000, 10, 'Too many requests, please try again later.')
};

// Security middleware setup
const setupSecurity = (app) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Sanitize data to prevent NoSQL injection
  app.use(mongoSanitize());

  // Apply general rate limiting
  app.use('/api/', rateLimiters.api);
};

module.exports = { setupSecurity, rateLimiters };
