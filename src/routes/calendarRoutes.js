const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  syncCalendarEvents,
  getCalendarEvents,
  getCalendarEventById,
  deleteCalendarEvent,
  getCalendarStats,
  getUpcomingEvents,
  getEventsByDateRange,
  createCalendarEvent,
} = require('../controllers/calendarController');

// All calendar routes require authentication
router.use(authenticateToken);

// Sync calendar events from frontend
router.post('/sync', syncCalendarEvents);

// Get all calendar events for authenticated user
router.get('/events', getCalendarEvents);

// Get a single calendar event by event_id
router.get('/events/:eventId', getCalendarEventById);

// Create a single calendar event
router.post('/events/create', createCalendarEvent);

// Get calendar events by date range
router.get('/events/range', getEventsByDateRange);

// Get upcoming calendar events
router.get('/upcoming', getUpcomingEvents);

// Get calendar statistics
router.get('/stats', getCalendarStats);

// Delete a specific calendar event
router.delete('/events/:eventId', deleteCalendarEvent);

module.exports = router;
