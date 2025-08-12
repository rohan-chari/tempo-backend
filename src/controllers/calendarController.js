const CalendarService = require('../services/calendarService');
const asyncHandler = require('../middleware/asyncHandler');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Sync calendar events from frontend
 * POST /api/calendar/sync
 */
const syncCalendarEvents = asyncHandler(async (req, res) => {
  const syncData = req.body;
  
  // Validate request body
  if (!syncData || !syncData.events || !syncData.userId) {
    return ResponseHandler.badRequest(res, 'Missing required fields: events and userId');
  }
  const result = await CalendarService.syncCalendarEvents(syncData);
  
  return ResponseHandler.success(res, 200, result, result.message);
});

/**
 * Get calendar events for authenticated user
 * GET /api/calendar/events
 */
const getCalendarEvents = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.user;
  const { startDate, endDate, calendarId } = req.query;

  const options = {};
  if (startDate) options.startDate = startDate;
  if (endDate) options.endDate = endDate;
  if (calendarId) options.calendarId = calendarId;

  const events = await CalendarService.getCalendarEvents(firebase_uid, options);
  
  return ResponseHandler.success(res, 200, {
    events,
    count: events.length,
  }, 'Calendar events retrieved successfully');
});

/**
 * Get a single calendar event by event_id
 * GET /api/calendar/events/:eventId
 */
const getCalendarEventById = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.user;
  const { eventId } = req.params;

  if (!eventId) {
    return ResponseHandler.badRequest(res, 'Event ID is required');
  }

  const event = await CalendarService.getCalendarEventById(firebase_uid, eventId);
  
  if (!event) {
    return ResponseHandler.notFound(res, 'Event not found');
  }

  return ResponseHandler.success(res, 200, event, 'Calendar event retrieved successfully');
});

/**
 * Delete a specific calendar event
 * DELETE /api/calendar/events/:eventId
 */
const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.user;
  const { eventId } = req.params;

  if (!eventId) {
    return ResponseHandler.badRequest(res, 'Event ID is required');
  }

  const result = await CalendarService.deleteCalendarEvent(firebase_uid, eventId);
  
  return ResponseHandler.success(res, 200, result, result.message);
});

/**
 * Get calendar statistics for authenticated user
 * GET /api/calendar/stats
 */
const getCalendarStats = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.user;

  const stats = await CalendarService.getCalendarStats(firebase_uid);
  
  return ResponseHandler.success(res, 200, stats, 'Calendar statistics retrieved successfully');
});

/**
 * Get upcoming calendar events (next 7 days)
 * GET /api/calendar/upcoming
 */
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.user;
  const { days = 7 } = req.query;

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + parseInt(days));

  const options = {
    startDate: new Date().toISOString(),
    endDate: endDate.toISOString()
  };

  const events = await CalendarService.getCalendarEvents(firebase_uid, options);
  
  return ResponseHandler.success(res, 200, {
    events,
    count: events.length,
    days: parseInt(days),
  }, 'Upcoming events retrieved successfully');
});

/**
 * Get calendar events for a specific date range
 * GET /api/calendar/events/range
 */
const getEventsByDateRange = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.user;
  const { startDate, endDate, calendarId } = req.query;

  if (!startDate || !endDate) {
    return ResponseHandler.badRequest(res, 'startDate and endDate are required');
  }

  const options = { startDate, endDate };
  if (calendarId) options.calendarId = calendarId;

  const events = await CalendarService.getCalendarEvents(firebase_uid, options);
  
  return ResponseHandler.success(res, 200, {
    events,
    count: events.length,
    startDate,
    endDate,
  }, 'Events retrieved successfully');
});

/**
 * Create a single calendar event from chat
 * POST /api/calendar/events/create
 */
const createCalendarEvent = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.user;
  const { event, attachedContacts, source } = req.body;

  // Validate required fields
  if (!event || !event.title || !event.startDate || !event.endDate) {
    return ResponseHandler.badRequest(res, 'Event with title, startDate, and endDate is required');
  }

  const result = await CalendarService.createCalendarEvent(firebase_uid, event, attachedContacts, source);
  
  return ResponseHandler.success(res, 201, result, 'Calendar event created successfully');
});

module.exports = {
  syncCalendarEvents,
  getCalendarEvents,
  getCalendarEventById,
  deleteCalendarEvent,
  getCalendarStats,
  getUpcomingEvents,
  getEventsByDateRange,
  createCalendarEvent,
};
