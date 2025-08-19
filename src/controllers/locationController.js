const LocationService = require('../services/locationService');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

class LocationController {
  /**
   * Search for locations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchLocations(req, res) {
    try {
      const { query, userLocation } = req.body;
      const firebaseUid = req.user.firebase_uid;

      // Validate required fields
      if (!query || typeof query !== 'string') {
        return ResponseHandler.badRequest(res, 'Query is required and must be a string');
      }

      if (query.trim().length === 0) {
        return ResponseHandler.badRequest(res, 'Query cannot be empty');
      }

      // Validate userLocation if provided
      if (userLocation) {
        if (typeof userLocation !== 'object' || 
            typeof userLocation.latitude !== 'number' || 
            typeof userLocation.longitude !== 'number') {
          return ResponseHandler.badRequest(res, 'userLocation must be an object with latitude and longitude numbers');
        }
      }

      logger.info('Location search request', {
        firebaseUid,
        query,
        userLocation,
        userAgent: req.get('User-Agent')
      });

      const result = await LocationService.searchLocations(firebaseUid, query, userLocation);

      return ResponseHandler.success(res, 200, result.data, 'Location search completed successfully');

    } catch (error) {
      logger.error('Location search controller error', {
        error: error.message,
        stack: error.stack,
        firebaseUid: req.user?.firebase_uid,
        body: req.body
      });

      return ResponseHandler.error(res, 500, `Failed to search locations: ${error.message}`);
    }
  }

  /**
   * Get user's saved locations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserLocations(req, res) {
    try {
      const firebaseUid = req.user.firebase_uid;

      logger.info('Get user locations request', {
        firebaseUid,
        userAgent: req.get('User-Agent')
      });

      const result = await LocationService.getUserLocations(firebaseUid);

      return ResponseHandler.success(res, 200, result.data, 'User locations retrieved successfully');

    } catch (error) {
      logger.error('Get user locations controller error', {
        error: error.message,
        stack: error.stack,
        firebaseUid: req.user?.firebase_uid
      });

      return ResponseHandler.error(res, 500, `Failed to get user locations: ${error.message}`);
    }
  }

  /**
   * Delete a user's saved location
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteLocation(req, res) {
    try {
      const { locationId } = req.params;
      const firebaseUid = req.user.firebase_uid;

      // Validate locationId
      if (!locationId || isNaN(parseInt(locationId))) {
        return ResponseHandler.badRequest(res, 'Valid location ID is required');
      }

      logger.info('Delete location request', {
        firebaseUid,
        locationId,
        userAgent: req.get('User-Agent')
      });

      const result = await LocationService.deleteLocation(firebaseUid, parseInt(locationId));

      return ResponseHandler.success(res, 200, result.data, result.message);

    } catch (error) {
      logger.error('Delete location controller error', {
        error: error.message,
        stack: error.stack,
        firebaseUid: req.user?.firebase_uid,
        locationId: req.params?.locationId
      });

      return ResponseHandler.error(res, 500, `Failed to delete location: ${error.message}`);
    }
  }
}

module.exports = LocationController;
