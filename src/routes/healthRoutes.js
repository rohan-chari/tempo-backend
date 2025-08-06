const express = require('express');
const HealthController = require('../controllers/healthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Get basic health status
 * @access  Public
 */
router.get('/', asyncHandler(HealthController.getHealth));

/**
 * @route   GET /health/detailed
 * @desc    Get detailed health status
 * @access  Public
 */
router.get('/detailed', asyncHandler(HealthController.getDetailedHealth));

module.exports = router;
