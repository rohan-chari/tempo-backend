const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  syncCalendarEvents,
  getCalendarEvents,
  deleteCalendarEvent,
  getCalendarStats,
  getUpcomingEvents,
  getEventsByDateRange,
} = require('../controllers/calendarController');

// All calendar routes require authentication
router.use(authenticateToken);

// Sync calendar events from frontend
router.post('/sync', syncCalendarEvents);

// Get all calendar events for authenticated user
router.get('/events', getCalendarEvents);

// Get calendar events by date range
router.get('/events/range', getEventsByDateRange);

// Get upcoming calendar events
router.get('/upcoming', getUpcomingEvents);

// Get calendar statistics
router.get('/stats', getCalendarStats);

// Delete a specific calendar event
router.delete('/events/:eventId', deleteCalendarEvent);

module.exports = router;
