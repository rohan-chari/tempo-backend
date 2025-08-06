const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Calendar preferences routes
router.post('/calendar-preferences', asyncHandler(UserController.saveCalendarPreferences));
router.get('/calendar-preferences', asyncHandler(UserController.getCalendarPreferences));

module.exports = router; 