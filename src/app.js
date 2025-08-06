const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');
const logger = require('./utils/logger');
const databaseConnection = require('./database/connection');
const firebaseService = require('./services/firebaseService');

class App {
  constructor () {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup all middleware
   */
  setupMiddleware () {
    // Security middleware
    this.app.use(securityMiddleware.helmet);
    this.app.use(securityMiddleware.cors);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Custom middleware
    this.app.use(securityMiddleware.requestLogger);
    this.app.use(securityMiddleware.validateRequest);
  }

  /**
   * Setup all routes
   */
  setupRoutes () {
    // API routes
    this.app.use(config.apiPrefix, routes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to Tempo Backend API',
        version: '1.0.0',
        documentation: `${config.apiPrefix}/health`,
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling () {
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  async start () {
    try {
      // Initialize database connection
      await databaseConnection.initialize();

      // Initialize Firebase service
      firebaseService.initialize();

      const server = this.app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
        logger.info(`API available at http://localhost:${config.port}${config.apiPrefix}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
        });
      });

      return server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Get the Express app instance
   */
  getApp () {
    return this.app;
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  const app = new App();
  app.start();
}

module.exports = App;
