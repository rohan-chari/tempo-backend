const ChatService = require('../services/chatService');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Chat controller for handling chat-related requests
 */
class ChatController {
  /**
   * Send a chat message and get response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendMessage (req, res) {
    try {
      const { message, context, permissions } = req.body;
      const user = req.user; // Set by auth middleware

      logger.info('Chat message received', {
        userId: user.firebase_uid,
        hasMessage: !!message,
        hasContext: !!context,
        hasPermissions: !!permissions,
      });

      // Validate request body
      if (!message) {
        return ResponseHandler.badRequest(res, 'Message is required');
      }

      if (typeof message !== 'string' || message.trim().length === 0) {
        return ResponseHandler.badRequest(res, 'Message must be a non-empty string');
      }

      if (message.length > 10000) {
        return ResponseHandler.badRequest(res, 'Message is too long (maximum 10,000 characters)');
      }

      // Check rate limiting
      const isWithinRateLimit = await ChatService.checkRateLimit(user);
      if (!isWithinRateLimit) {
        return ResponseHandler.error(res, 429, 'Rate limit exceeded. Please try again later.');
      }

      // Process the message
      const chatResponse = await ChatService.processMessage(
        { message: message.trim(), context, permissions },
        user,
      );

      // Log the interaction
      await ChatService.logChatInteraction(user, req.body, chatResponse);

      // Return successful response
      return ResponseHandler.success(
        res,
        200,
        chatResponse,
        'Message processed successfully',
      );

    } catch (error) {
      logger.error('Chat message processing failed:', error);

      // Handle specific error types
      if (error.message === 'Message is required and must be a non-empty string') {
        return ResponseHandler.badRequest(res, error.message);
      }

      if (error.message === 'Invalid permissions structure') {
        return ResponseHandler.badRequest(res, 'Invalid permissions format');
      }

      if (error.message === 'Failed to generate response') {
        return ResponseHandler.error(res, 503, 'Chat service temporarily unavailable');
      }

      // AI service errors normalized by calendarNlpService
      if (error.status === 401) {
        return ResponseHandler.unauthorized(res, 'AI service authentication failed');
      }
      if (error.status === 403) {
        return ResponseHandler.forbidden(res, 'AI service access forbidden');
      }
      if (error.status === 429) {
        return ResponseHandler.error(res, 429, 'AI service rate limit exceeded. Please try again shortly.');
      }
      if (error.status === 502) {
        return ResponseHandler.error(res, 502, 'AI returned invalid output. Please try again.');
      }
      if (error.status === 503) {
        return ResponseHandler.error(res, 503, 'AI service unavailable');
      }
      if (error.status === 504) {
        return ResponseHandler.error(res, 504, 'AI service timed out. Please retry.');
      }

      // Generic error response
      return ResponseHandler.error(res, 500, 'Failed to process chat message');
    }
  }

  /**
   * Get chat history for a user (placeholder for future implementation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getChatHistory (req, res) {
    try {
      const user = req.user;
      const { limit = 50, offset = 0 } = req.query;

      logger.info('Chat history requested', {
        userId: user.firebase_uid,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Validate query parameters
      const parsedLimit = parseInt(limit);
      const parsedOffset = parseInt(offset);

      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return ResponseHandler.badRequest(res, 'Limit must be between 1 and 100');
      }

      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return ResponseHandler.badRequest(res, 'Offset must be 0 or greater');
      }

      // Placeholder implementation
      // In a real implementation, you'd fetch from database
      const mockHistory = {
        messages: [],
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: 0,
          hasMore: false,
        },
      };

      return ResponseHandler.success(
        res,
        200,
        mockHistory,
        'Chat history retrieved successfully',
      );

    } catch (error) {
      logger.error('Failed to get chat history:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve chat history');
    }
  }

  /**
   * Clear chat history for a user (placeholder for future implementation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async clearChatHistory (req, res) {
    try {
      const user = req.user;

      logger.info('Chat history clear requested', {
        userId: user.firebase_uid,
      });

      // Placeholder implementation
      // In a real implementation, you'd delete from database
      // await ChatHistory.deleteByUserId(user.firebase_uid);

      return ResponseHandler.success(
        res,
        200,
        { cleared: true },
        'Chat history cleared successfully',
      );

    } catch (error) {
      logger.error('Failed to clear chat history:', error);
      return ResponseHandler.error(res, 500, 'Failed to clear chat history');
    }
  }

  /**
   * Get chat service status and health
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getStatus (req, res) {
    try {
      // Check if chat service is healthy
      const status = {
        service: 'chat',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
          messageProcessing: true,
          rateLimit: true,
          contextAware: true,
          permissionAware: true,
        },
      };

      return ResponseHandler.success(
        res,
        200,
        status,
        'Chat service status retrieved successfully',
      );

    } catch (error) {
      logger.error('Failed to get chat service status:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve service status');
    }
  }
}

module.exports = ChatController;
