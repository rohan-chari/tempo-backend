const firebaseService = require('../services/firebaseService');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify Firebase tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access token is required');
    }

    // Verify Firebase token
    const decodedToken = await firebaseService.verifyIdToken(token);

    // Add user info to request object
    req.user = {
      firebase_uid: decodedToken.uid,
      email: decodedToken.email,
    };

    logger.info('Token authenticated successfully', { uid: decodedToken.uid });
    next();
  } catch (error) {
    logger.error('Token authentication failed:', error);

    if (error.message === 'Invalid Firebase token') {
      return ResponseHandler.unauthorized(res, 'Invalid or expired token');
    }

    return ResponseHandler.unauthorized(res, 'Authentication failed');
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    // Verify Firebase token
    const decodedToken = await firebaseService.verifyIdToken(token);

    // Add user info to request object
    req.user = {
      firebase_uid: decodedToken.uid,
      email: decodedToken.email,
    };

    logger.info('Optional token authenticated successfully', { uid: decodedToken.uid });
    next();
  } catch (error) {
    logger.error('Optional token authentication failed:', error);

    // For optional auth, we don't fail the request
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
