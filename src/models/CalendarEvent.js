const db = require('../database/connection');
const logger = require('../utils/logger');

class CalendarEvent {
  static async create(eventData) {
    const {
      event_id,
      user_id,
      title,
      start_date,
      end_date,
      is_all_day,
      notes,
      location,
      calendar_id,
      calendar_name,
      firebase_uid,
      fetched_at
    } = eventData;

    // Convert ISO datetime strings to MySQL datetime format if they're strings
    const formatDateTime = (dateTime) => {
      if (typeof dateTime === 'string') {
        return new Date(dateTime).toISOString().slice(0, 19).replace('T', ' ');
      }
      return dateTime;
    };

    const query = `
      INSERT INTO calendar_events 
      (event_id, user_id, title, start_date, end_date, is_all_day, notes, location, calendar_id, calendar_name, firebase_uid, fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      event_id,
      user_id,
      title,
      formatDateTime(start_date),
      formatDateTime(end_date),
      is_all_day,
      notes || null,
      location || null,
      calendar_id,
      calendar_name,
      firebase_uid,
      formatDateTime(fetched_at)
    ];

    try {
      const result = await db.query(query, values);
      return result;
    } catch (error) {
      throw new Error(`Error creating calendar event: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    const query = `
      SELECT * FROM calendar_events 
      WHERE user_id = ? 
      ORDER BY start_date ASC
    `;

    try {
      const rows = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding calendar events by user ID: ${error.message}`);
    }
  }

  static async findByFirebaseUid(firebaseUid) {
    const query = `
      SELECT ce.* FROM calendar_events ce
      JOIN users u ON ce.user_id = u.id
      WHERE u.firebase_uid = ?
      ORDER BY ce.start_date ASC
    `;

    try {
      const rows = await db.query(query, [firebaseUid]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding calendar events by Firebase UID: ${error.message}`);
    }
  }

  static async deleteByEventId(eventId, userId) {
    const query = `
      DELETE FROM calendar_events 
      WHERE event_id = ? AND user_id = ?
    `;

    try {
      const result = await db.query(query, [eventId, userId]);
      return result;
    } catch (error) {
      throw new Error(`Error deleting calendar event: ${error.message}`);
    }
  }

  static async deleteByFirebaseUid(firebaseUid) {
    const query = `
      DELETE ce FROM calendar_events ce
      JOIN users u ON ce.user_id = u.id
      WHERE u.firebase_uid = ?
    `;

    try {
      const result = await db.query(query, [firebaseUid]);
      return result;
    } catch (error) {
      throw new Error(`Error deleting calendar events by Firebase UID: ${error.message}`);
    }
  }

  static async syncEvents(events, userId, firebaseUid) {
    // Get a connection for transaction
    const pool = db.getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Log sync operation start
      logger.info('Starting calendar sync', {
        userId,
        firebaseUid,
        eventsCount: events.length,
        eventIds: events.map(e => e.id),
      });

      // Step 1: Upsert all events from sync payload
      for (const event of events) {
        // Convert ISO datetime strings to MySQL datetime format
        const startDate = new Date(event.startDate).toISOString().slice(0, 19).replace('T', ' ');
        const endDate = new Date(event.endDate).toISOString().slice(0, 19).replace('T', ' ');
        const fetchedAt = new Date(event.fetchedAt).toISOString().slice(0, 19).replace('T', ' ');
        
        await connection.execute(`
          INSERT INTO calendar_events 
          (event_id, user_id, title, start_date, end_date, is_all_day, notes, location, calendar_id, calendar_name, firebase_uid, fetched_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          start_date = VALUES(start_date),
          end_date = VALUES(end_date),
          is_all_day = VALUES(is_all_day),
          notes = VALUES(notes),
          location = VALUES(location),
          calendar_id = VALUES(calendar_id),
          calendar_name = VALUES(calendar_name),
          firebase_uid = VALUES(firebase_uid),
          fetched_at = VALUES(fetched_at),
          updated_at = CURRENT_TIMESTAMP
        `, [
          event.id,
          userId,
          event.title,
          startDate,
          endDate,
          event.isAllDay,
          event.notes || null,
          event.location || null,
          event.calendarId,
          event.calendarName,
          firebaseUid,
          fetchedAt
        ]);
      }

      // Step 2: Delete events that are not in the sync payload
      // Get all event_ids from the sync payload
      const syncEventIds = events.map(event => event.id);
      
      if (syncEventIds.length > 0) {
        // Delete events for this user that are not in the sync payload
        // The ON DELETE CASCADE will automatically delete related event_contacts
        const placeholders = syncEventIds.map(() => '?').join(',');
        const deleteResult = await connection.execute(`
          DELETE FROM calendar_events 
          WHERE user_id = ? 
          AND event_id NOT IN (${placeholders})
        `, [userId, ...syncEventIds]);
        
        logger.info('Calendar sync completed', {
          userId,
          firebaseUid,
          eventsUpserted: events.length,
          eventsDeleted: deleteResult.affectedRows,
          syncEventIds,
        });
      } else {
        // If no events in sync payload, delete all events for this user
        const deleteResult = await connection.execute(`
          DELETE FROM calendar_events 
          WHERE user_id = ?
        `, [userId]);
        
        logger.info('Calendar sync completed - all events deleted', {
          userId,
          firebaseUid,
          eventsUpserted: 0,
          eventsDeleted: deleteResult.affectedRows,
        });
      }

      await connection.commit();
      return { success: true, eventsCount: events.length };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error syncing calendar events: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = CalendarEvent;
