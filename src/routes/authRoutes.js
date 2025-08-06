const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

/**
 * @route   POST /auth/signin
 * @desc    Sign in user with Firebase token
 * @access  Public
 */
router.post('/signin', asyncHandler(AuthController.signIn));

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, asyncHandler(AuthController.getProfile));

/**
 * @route   PUT /auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, asyncHandler(AuthController.updateProfile));

module.exports = router;
