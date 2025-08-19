const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const {
  searchLocations
} = require('../controllers/locationController');

// All location routes require authentication
router.use(authenticateToken);

// Search for locations
router.post('/search', asyncHandler(searchLocations));

module.exports = router;
