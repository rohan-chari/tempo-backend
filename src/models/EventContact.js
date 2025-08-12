const db = require('../database/connection');

class EventContact {
  static async create(contactData) {
    const {
      event_id,
      contact_id,
      contact_name,
      contact_emails,
      contact_phone_numbers
    } = contactData;

    const query = `
      INSERT INTO event_contacts 
      (event_id, contact_id, contact_name, contact_emails, contact_phone_numbers)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      event_id,
      contact_id,
      contact_name,
      JSON.stringify(contact_emails || []),
      JSON.stringify(contact_phone_numbers || [])
    ];

    try {
      const result = await db.query(query, values);
      return result;
    } catch (error) {
      throw new Error(`Error creating event contact: ${error.message}`);
    }
  }

  static async findByEventId(eventId) {
    const query = `
      SELECT * FROM event_contacts 
      WHERE event_id = ? 
      ORDER BY created_at ASC
    `;
  
    try {
      const rows = await db.query(query, [eventId]);
      return rows.map(row => {
        let contact_emails = [];
        let contact_phone_numbers = [];
  
        try {
          contact_emails = JSON.parse(row.contact_emails || '[]');
        } catch (e) {
          // If it's not valid JSON, treat it as a single email string
          contact_emails = row.contact_emails ? [row.contact_emails] : [];
        }
  
        try {
          contact_phone_numbers = JSON.parse(row.contact_phone_numbers || '[]');
        } catch (e) {
          // If it's not valid JSON, treat it as a single phone string
          contact_phone_numbers = row.contact_phone_numbers ? [row.contact_phone_numbers] : [];
        }
  
        return {
          contact_id: row.contact_id,
          contact_name: row.contact_name,
          contact_emails,
          contact_phone_numbers,
        };
      });
    } catch (error) {
      throw new Error(`Error finding event contacts by event ID: ${error.message}`);
    }
  }

  static async deleteByEventId(eventId) {
    const query = `
      DELETE FROM event_contacts 
      WHERE event_id = ?
    `;

    try {
      const result = await db.query(query, [eventId]);
      return result;
    } catch (error) {
      throw new Error(`Error deleting event contacts: ${error.message}`);
    }
  }

  static async createMultiple(eventId, contacts) {
    if (!contacts || contacts.length === 0) {
      return [];
    }

    const connection = await db.getPool().getConnection();
    
    try {
      await connection.beginTransaction();

      const results = [];
      for (const contact of contacts) {
        // Ensure emails and phone numbers are arrays
        const emails = Array.isArray(contact.emails) ? contact.emails : [];
        const phoneNumbers = Array.isArray(contact.phoneNumbers) ? contact.phoneNumbers : [];
        
        const contactData = {
          event_id: eventId,
          contact_id: contact.id,
          contact_name: contact.name,
          contact_emails: emails,
          contact_phone_numbers: phoneNumbers
        };

        const result = await connection.execute(`
          INSERT INTO event_contacts 
          (event_id, contact_id, contact_name, contact_emails, contact_phone_numbers)
          VALUES (?, ?, ?, ?, ?)
        `, [
          contactData.event_id,
          contactData.contact_id,
          contactData.contact_name,
          JSON.stringify(contactData.contact_emails),
          JSON.stringify(contactData.contact_phone_numbers)
        ]);

        results.push(result);
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating multiple event contacts: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = EventContact;
