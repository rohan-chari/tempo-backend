const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Health check controller
 */
class HealthController {
  /**
   * Get API health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getHealth (req, res) {
    try {
      const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };

      logger.info('Health check requested', { ip: req.ip });
      return ResponseHandler.success(res, 200, healthData, 'API is healthy');
    } catch (error) {
      logger.error('Health check failed', error);
      return ResponseHandler.error(res, 500, 'Health check failed');
    }
  }

  /**
   * Get detailed health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getDetailedHealth (req, res) {
    try {
      const detailedHealth = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
        },
        platform: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        // Add database health check here when database is implemented
        services: {
          database: 'OK', // Placeholder for future database health check
        },
      };

      logger.info('Detailed health check requested', { ip: req.ip });
      return ResponseHandler.success(res, 200, detailedHealth, 'Detailed health status');
    } catch (error) {
      logger.error('Detailed health check failed', error);
      return ResponseHandler.error(res, 500, 'Detailed health check failed');
    }
  }
}

module.exports = HealthController;
