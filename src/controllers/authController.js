const firebaseService = require('../services/firebaseService');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Authentication controller
 */
class AuthController {
  /**
   * Sign in user with Firebase token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async signIn (req, res) {
    try {
      const { idToken } = req.body;

      // Validate request
      if (!idToken) {
        return ResponseHandler.badRequest(res, 'Firebase ID token is required');
      }

      // Verify Firebase token
      const decodedToken = await firebaseService.verifyIdToken(idToken);

      // Get user data from Firebase
      const firebaseUser = await firebaseService.getUser(decodedToken.uid);

      // Find or create user in database
      const user = await User.findOrCreate(firebaseUser);

      // Remove sensitive data from response
      const userResponse = {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        display_name: user.display_name,
        photo_url: user.photo_url,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      logger.info('User signed in successfully', {
        uid: user.firebase_uid,
        email: user.email,
      });

      return ResponseHandler.success(res, 200, userResponse, 'Sign in successful');
    } catch (error) {
      logger.error('Sign in failed:', error);

      if (error.message === 'Invalid Firebase token') {
        return ResponseHandler.unauthorized(res, 'Invalid authentication token');
      }

      if (error.message === 'User not found in Firebase') {
        return ResponseHandler.unauthorized(res, 'User not found');
      }

      return ResponseHandler.error(res, 500, 'Sign in failed');
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProfile (req, res) {
    try {
      const { firebase_uid } = req.user; // Set by auth middleware

      const user = await User.findByFirebaseUid(firebase_uid);

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Remove sensitive data from response
      const userResponse = {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        display_name: user.display_name,
        photo_url: user.photo_url,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      return ResponseHandler.success(res, 200, userResponse, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Get profile failed:', error);
      return ResponseHandler.error(res, 500, 'Failed to get profile');
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateProfile (req, res) {
    try {
      const { firebase_uid } = req.user; // Set by auth middleware
      const { display_name, photo_url } = req.body;

      // Validate request
      if (!display_name && !photo_url) {
        return ResponseHandler.badRequest(res, 'At least one field is required for update');
      }

      const updateData = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (photo_url !== undefined) updateData.photo_url = photo_url;

      const updatedUser = await User.update(firebase_uid, updateData);

      // Remove sensitive data from response
      const userResponse = {
        id: updatedUser.id,
        firebase_uid: updatedUser.firebase_uid,
        email: updatedUser.email,
        display_name: updatedUser.display_name,
        photo_url: updatedUser.photo_url,
        email_verified: updatedUser.email_verified,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      };

      logger.info('Profile updated successfully', { uid: firebase_uid });
      return ResponseHandler.success(res, 200, userResponse, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile failed:', error);
      return ResponseHandler.error(res, 500, 'Failed to update profile');
    }
  }
}

module.exports = AuthController;
