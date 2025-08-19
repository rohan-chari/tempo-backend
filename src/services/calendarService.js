const CalendarEvent = require('../models/CalendarEvent');
const EventContact = require('../models/EventContact');
const User = require('../models/User');
const logger = require('../utils/logger');

class CalendarService {
  /**
   * Sync calendar events for a user
   * @param {Object} syncData - The sync payload from frontend
   * @param {Array} syncData.events - Array of calendar events
   * @param {string} syncData.userId - Firebase UID of the user
   * @param {string} syncData.timestamp - Sync timestamp
   * @param {string} syncData.source - Source of the sync
   * @returns {Object} Sync result
   */
  static async syncCalendarEvents (syncData) {
    const { events, userId: firebaseUid } = syncData;

    // Validate required fields
    if (!events || !Array.isArray(events)) {
      throw new Error('Events array is required');
    }

    if (!firebaseUid) {
      throw new Error('User ID is required');
    }

    // Get user from database
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate events structure
    for (const event of events) {
      if (!event.id || !event.title || !event.startDate || !event.endDate) {
        throw new Error('Invalid event structure: missing required fields');
      }
    }

    // Sync events to database
    const result = await CalendarEvent.syncEvents(events, user.id, firebaseUid);

    return {
      success: true,
      message: `Successfully synced ${result.eventsCount} calendar events`,
      eventsCount: result.eventsCount,
      timestamp: new Date().toISOString(),
      syncType: 'full_sync_with_cleanup',
    };
  }

  /**
   * Get a single calendar event by event_id
   * @param {string} firebaseUid - Firebase UID of the user
   * @param {string} eventId - The event_id to search for
   * @returns {Object|null} Calendar event with contacts or null if not found
   */
  static async getCalendarEventById (firebaseUid, eventId) {
    try {
      const events = await CalendarEvent.findByFirebaseUid(firebaseUid);
      const event = events.find(e => e.event_id === eventId);
      
      if (!event) {
        return null;
      }
  
      // Add contacts to the event
      const contacts = await EventContact.findByEventId(event.id);
      
      // Transform contacts to match frontend expectations
      const transformedContacts = contacts.map(contact => ({
        id: contact.contact_id,
        name: contact.contact_name,
        emails: Array.isArray(contact.contact_emails) ? contact.contact_emails : [contact.contact_emails].filter(Boolean),
        phoneNumbers: Array.isArray(contact.contact_phone_numbers) ? contact.contact_phone_numbers : [contact.contact_phone_numbers].filter(Boolean)
      }));
  
      return {
        event: {
          id: event.event_id,
          title: event.title,
          startDate: event.start_date,
          endDate: event.end_date,
          location: event.location,
          notes: event.notes,
          isAllDay: event.is_all_day === 1,
          calendarId: event.calendar_id,
          calendarName: event.calendar_name,
          attendees: event.attendees,
          userId: event.user_id,
          createdAt: event.created_at
        },
        attachedContacts: transformedContacts,
        source: 'backend'
      };
  
    } catch (error) {
      logger.error('Failed to get calendar event by ID', {
        error: error.message,
        userId: firebaseUid,
        eventId
      });
      throw error;
    }
  }

  /**
   * Get calendar events for a user
   * @param {string} firebaseUid - Firebase UID of the user
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Filter events from this date
   * @param {Date} options.endDate - Filter events until this date
   * @param {string} options.calendarId - Filter by specific calendar
   * @returns {Array} Array of calendar events
   */
  static async getCalendarEvents(firebaseUid, options = {}) {
    try {
      const events = await CalendarEvent.findByFirebaseUid(firebaseUid);
      
      // Apply filters if provided
      let filteredEvents = events;

      if (options.startDate) {
        const startDate = new Date(options.startDate);
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.start_date) >= startDate
        );
      }

      if (options.endDate) {
        const endDate = new Date(options.endDate);
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.end_date) <= endDate
        );
      }

      if (options.calendarId) {
        filteredEvents = filteredEvents.filter(event => 
          event.calendar_id === options.calendarId
        );
      }

      // Add contacts to each event
      const eventsWithContacts = await Promise.all(
        filteredEvents.map(async (event) => {
          const contacts = await EventContact.findByEventId(event.id);
          return {
            ...event,
            attachedContacts: contacts,
          };
        })
      );

      return eventsWithContacts;

    } catch (error) {
      logger.error('Failed to get calendar events', {
        error: error.message,
        userId: firebaseUid
      });
      throw error;
    }
  }

  /**
   * Delete a specific calendar event
   * @param {string} firebaseUid - Firebase UID of the user
   * @param {string} eventId - ID of the event to delete
   * @returns {Object} Deletion result
   */
  static async deleteCalendarEvent(firebaseUid, eventId) {
    try {
      const user = await User.findByFirebaseUid(firebaseUid);
      if (!user) {
        throw new Error('User not found');
      }

      const result = await CalendarEvent.deleteByEventId(eventId, user.id);
      
      if (result.affectedRows === 0) {
        throw new Error('Event not found or not owned by user');
      }

      logger.info(`Calendar event deleted`, {
        userId: firebaseUid,
        eventId
      });

      return {
        success: true,
        message: 'Calendar event deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete calendar event', {
        error: error.message,
        userId: firebaseUid,
        eventId
      });
      throw error;
    }
  }

  /**
   * Create a single calendar event
   * @param {string} firebaseUid - Firebase UID of the user
   * @param {Object} event - Event data
   * @param {Array} attachedContacts - Array of contact objects
   * @param {string} source - Source of the event creation
   * @returns {Object} Created event
   */
  static async createCalendarEvent(firebaseUid, event, attachedContacts = [], source = 'chat_creation') {
    try {
      // Get user from database
      const user = await User.findByFirebaseUid(firebaseUid);
      if (!user) {
        throw new Error('User not found');
      }

      // Convert ISO datetime strings to MySQL datetime format
      const startDate = new Date(event.startDate).toISOString().slice(0, 19).replace('T', ' ');
      const endDate = new Date(event.endDate).toISOString().slice(0, 19).replace('T', ' ');
      const createdAt = new Date(event.createdAt || new Date()).toISOString().slice(0, 19).replace('T', ' ');

      const eventData = {
        event_id: event.id,
        user_id: user.id,
        title: event.title,
        start_date: startDate,
        end_date: endDate,
        is_all_day: event.isAllDay || false,
        notes: event.notes || null,
        location: event.location || null,
        calendar_id: event.calendarId,
        calendar_name: event.calendarName,
        firebase_uid: firebaseUid,
        fetched_at: createdAt,
      };

      // Create the event in database
      const result = await CalendarEvent.create(eventData);
      const eventDatabaseId = result.insertId;

      // Store attached contacts if any
      let storedContacts = [];
      if (attachedContacts && attachedContacts.length > 0) {
        await EventContact.createMultiple(eventDatabaseId, attachedContacts);
        storedContacts = await EventContact.findByEventId(eventDatabaseId);
      }

      return {
        success: true,
        message: `Event "${event.title}" created successfully`,
        event: {
          ...event,
          databaseId: eventDatabaseId,
          attachedContacts: storedContacts,
          source,
        },
      };

    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Get calendar statistics for a user
   * @param {string} firebaseUid - Firebase UID of the user
   * @returns {Object} Calendar statistics
   */
  static async getCalendarStats(firebaseUid) {
    try {
      const events = await CalendarEvent.findByFirebaseUid(firebaseUid);
      
      const stats = {
        totalEvents: events.length,
        calendars: {},
        upcomingEvents: 0,
        pastEvents: 0
      };

      const now = new Date();

      events.forEach(event => {
        // Count by calendar
        if (!stats.calendars[event.calendar_name]) {
          stats.calendars[event.calendar_name] = 0;
        }
        stats.calendars[event.calendar_name]++;

        // Count upcoming vs past events
        const eventStart = new Date(event.start_date);
        if (eventStart > now) {
          stats.upcomingEvents++;
        } else {
          stats.pastEvents++;
        }
      });

      return stats;

    } catch (error) {
      logger.error('Failed to get calendar stats', {
        error: error.message,
        userId: firebaseUid
      });
      throw error;
    }
  }
}

module.exports = CalendarService;
