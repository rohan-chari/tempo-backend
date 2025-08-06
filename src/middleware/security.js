const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');

/**
 * Security middleware configuration
 */
const securityMiddleware = {
  /**
   * Configure CORS
   */
  cors: cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),

  /**
   * Configure Helmet for security headers
   */
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        scriptSrc: ['\'self\''],
        imgSrc: ['\'self\'', 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),

  /**
   * Request logging middleware
   */
  requestLogger: (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
  },

  /**
   * Basic request validation
   */
  validateRequest: (req, res, next) => {
    // Check for required headers
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!req.is('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Content-Type must be application/json',
        });
      }
    }

    next();
  },
};

module.exports = securityMiddleware;
