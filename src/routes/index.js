const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const calendarRoutes = require('./calendarRoutes');
const locationRoutes = require('./locationRoutes');

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/user', userRoutes);

// Chat routes
router.use('/chat', chatRoutes);

// Calendar routes
router.use('/calendar', calendarRoutes);

// Location routes
router.use('/locations', locationRoutes);

// API routes (to be added as modules are created)
// router.use('/posts', postRoutes);

module.exports = router;
