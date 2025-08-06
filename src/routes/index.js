const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// API routes (to be added as modules are created)
// router.use('/users', userRoutes);
// router.use('/posts', postRoutes);

module.exports = router;
