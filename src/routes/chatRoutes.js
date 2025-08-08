const express = require('express');
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

/**
 * @route   POST /chat/message
 * @desc    Send a chat message and get AI response
 * @access  Private
 * @body    {
 *   message: string (required) - The user's message
 *   context?: object - Additional context for the message
 *   permissions?: object - User permissions status
 * }
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     message: string,
 *     type: string,
 *     timestamp: string,
 *     messageId: string,
 *     metadata: object,
 *     user: object
 *   }
 * }
 */
router.post('/message', authenticateToken, asyncHandler(ChatController.sendMessage));

/**
 * @route   GET /chat/history
 * @desc    Get chat history for the authenticated user
 * @access  Private
 * @query   {
 *   limit?: number (1-100, default: 50) - Number of messages to return
 *   offset?: number (default: 0) - Number of messages to skip
 * }
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     messages: array,
 *     pagination: {
 *       limit: number,
 *       offset: number,
 *       total: number,
 *       hasMore: boolean
 *     }
 *   }
 * }
 */
router.get('/history', authenticateToken, asyncHandler(ChatController.getChatHistory));

/**
 * @route   DELETE /chat/history
 * @desc    Clear chat history for the authenticated user
 * @access  Private
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     cleared: boolean
 *   }
 * }
 */
router.delete('/history', authenticateToken, asyncHandler(ChatController.clearChatHistory));

/**
 * @route   GET /chat/status
 * @desc    Get chat service status and health
 * @access  Private
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     service: string,
 *     status: string,
 *     timestamp: string,
 *     version: string,
 *     features: object
 *   }
 * }
 */
router.get('/status', authenticateToken, asyncHandler(ChatController.getStatus));

module.exports = router;
