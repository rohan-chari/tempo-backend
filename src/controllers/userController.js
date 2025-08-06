const User = require('../models/User');
const logger = require('../utils/logger');
const ResponseHandler = require('../utils/responseHandler');

class UserController {
  /**
   * Save calendar preferences for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async saveCalendarPreferences(req, res) {
    try {
      const { calendarIds } = req.body;
      const userId = req.user.firebase_uid; // From auth middleware

      // Validate input
      if (!calendarIds || !Array.isArray(calendarIds)) {
        return ResponseHandler.badRequest(res, 'calendarIds must be an array');
      }

      // Update user with calendar preferences
      await User.updateCalendarPreferences(userId, calendarIds);

      logger.info('Calendar preferences saved successfully', { 
        userId, 
        calendarCount: calendarIds.length 
      });

      return ResponseHandler.success(res, 200, {
        calendarIds: calendarIds
      }, 'Calendar preferences saved successfully');

    } catch (error) {
      logger.error('Error saving calendar preferences:', error);
      return ResponseHandler.error(res, 500, 'Failed to save calendar preferences');
    }
  }

  /**
   * Get calendar preferences for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCalendarPreferences(req, res) {
    try {
      const userId = req.user.firebase_uid; // From auth middleware

      // Get calendar preferences
      const calendarIds = await User.getCalendarPreferences(userId);

      logger.info('Calendar preferences retrieved successfully', { userId });

      return ResponseHandler.success(res, 200, {
        calendarIds: calendarIds
      }, 'Calendar preferences retrieved successfully');

    } catch (error) {
      logger.error('Error getting calendar preferences:', error);
      return ResponseHandler.error(res, 500, 'Failed to get calendar preferences');
    }
  }


}

module.exports = UserController; 