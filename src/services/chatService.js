const logger = require('../utils/logger');
const { parseCalendarIntent } = require('./calendarNlpService');

/**
 * Chat service for handling chat message processing
 */
class ChatService {
  /**
   * Process a chat message and generate response
   * @param {Object} messageData - The message data from the request
   * @param {Object} user - The authenticated user
   * @returns {Promise<Object>} Chat response object
   */
  static async processMessage (messageData, user) {
    try {
      const { message, context, permissions } = messageData;

      logger.info('Processing chat message', {
        userId: user.firebase_uid,
        messageLength: message?.length || 0,
        hasContext: !!context,
        hasPermissions: !!permissions,
      });

      // Validate required fields
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('Message is required and must be a non-empty string');
      }

      // Validate permissions if provided
      if (permissions && !this.validatePermissions(permissions)) {
        throw new Error('Invalid permissions structure');
      }

      // Process the message with AI
      const response = await this.generateChatResponse(message, context, permissions, user);

      logger.info('Chat message processed successfully', {
        userId: user.firebase_uid,
        responseLength: response.message?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to process chat message:', error);
      throw error;
    }
  }

  /**
   * Generate chat response using AI/NLP services
   * @private
   * @param {string} message - The user's message
   * @param {Object} context - Additional context for the message
   * @param {Object} permissions - User permissions
   * @param {Object} user - The authenticated user
   * @returns {Promise<Object>} Generated response
   */
  static async generateChatResponse (message, context, permissions, user) {
    try {
      const metadata = {};

      // Short-circuit: friendly greeting for low-intent greetings
      const normalized = message.trim().toLowerCase();
      const isGreeting = /^(hi|hello|hey|yo|sup|howdy|hola|bonjour|hallo)(!|\.)?$/.test(normalized);
      if (isGreeting) {
        return {
          message: "Hello! I'm here to help with your calendar. You can say things like 'Create lunch with Sam tomorrow at 1pm' or 'Show my events for Friday'.",
          type: 'text',
          timestamp: new Date().toISOString(),
          messageId: this.generateMessageId(),
          metadata: { greeting: true },
          user: {
            id: user.firebase_uid,
            email: user.email,
          },
        };
      }

      // Try to parse calendar intent for any non-greeting message
      try {
        // Pass contacts from context if available
        const contacts = context?.contacts || [];
        const calendarIntent = await parseCalendarIntent(message, { contacts });
        metadata.calendarIntent = calendarIntent;
        
        // Generate response based on calendar intent
        const responseMessage = this.generateCalendarResponse(calendarIntent);
        const responseType = 'calendar_action';
        
        return {
          message: responseMessage,
          type: responseType,
          timestamp: new Date().toISOString(),
          messageId: this.generateMessageId(),
          metadata,
          user: {
            id: user.firebase_uid,
            email: user.email,
          },
        };
      } catch (aiError) {
        // If calendar parsing fails, return a generic response
        logger.warn('Calendar intent parsing failed, using fallback response', {
          error: aiError.message,
          userInput: message,
        });

        return {
          message: 'I understand your message. How can I help you with your calendar or other tasks?',
          type: 'text',
          timestamp: new Date().toISOString(),
          messageId: this.generateMessageId(),
          metadata: {
            fallback: true,
            error: aiError.message,
          },
          user: {
            id: user.firebase_uid,
            email: user.email,
          },
        };
      }
    } catch (error) {
      logger.error('Failed to generate chat response:', error);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Generate response message based on calendar intent
   * @private
   * @param {Object} calendarIntent - Parsed calendar intent from AI
   * @returns {string} Human-readable response message
   */
  static generateCalendarResponse (calendarIntent) {
    const { action, title, startDate, endDate, timeStart, timeEnd, contacts } = calendarIntent;

    switch (action) {
      case 'CREATE':
        if (title && startDate) {
          const timeStr = timeStart ? ` at ${timeStart}` : '';
          const endTimeStr = timeEnd && timeEnd !== timeStart ? ` until ${timeEnd}` : '';
          const contactStr = contacts && contacts.length > 0 ? ` with ${contacts.join(', ')}` : '';
          
          // Handle single day vs multi-day events
          if (startDate === endDate) {
            return `I'll create an event "${title}" on ${startDate}${timeStr}${endTimeStr}${contactStr}.`;
          } else {
            return `I'll create an event "${title}" from ${startDate} to ${endDate}${timeStr}${endTimeStr}${contactStr}.`;
          }
        }
        return 'I understand you want to create an event. Could you provide more details like the title and date?';
      
      case 'GET':
        if (startDate && endDate) {
          if (startDate === endDate) {
            return `I'll show you your schedule for ${startDate}.`;
          } else {
            return `I'll show you your schedule from ${startDate} to ${endDate}.`;
          }
        } else if (startDate) {
          return `I'll show you your schedule for ${startDate}.`;
        }
        return 'I\'ll show you your calendar.';
      
      case 'UPDATE':
        if (title) {
          return `I'll help you update the event "${title}". What changes would you like to make?`;
        }
        return 'I understand you want to update an event. Which event would you like to modify?';
      
      case 'DELETE':
        if (title) {
          return `I'll help you delete the event "${title}".`;
        }
        return 'I understand you want to delete an event. Which event would you like to remove?';
      
      default:
        return 'I understand your calendar request. How can I help you further?';
    }
  }

  /**
   * Validate permissions structure
   * @private
   * @param {Object} permissions - Permissions object to validate
   * @returns {boolean} Whether permissions are valid
   */
  static validatePermissions (permissions) {
    if (!permissions || typeof permissions !== 'object') {
      return false;
    }

    // Add your specific permission validation logic here
    // This is a basic example - adjust based on your PermissionStatus type
    const validKeys = ['calendar', 'contacts', 'notifications', 'location'];
    const validValues = ['granted', 'denied', 'prompt', 'default'];

    for (const [key, value] of Object.entries(permissions)) {
      if (!validKeys.includes(key) || !validValues.includes(value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate a unique message ID
   * @private
   * @returns {string} Unique message ID
   */
  static generateMessageId () {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ChatService;
