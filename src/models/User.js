const databaseConnection = require('../database/connection');
const logger = require('../utils/logger');

class User {
  /**
   * Find user by Firebase UID
   * @param {string} firebaseUid - Firebase user ID
   * @returns {Object|null} User object or null
   */
  static async findByFirebaseUid (firebaseUid) {
    try {
      const sql = 'SELECT * FROM users WHERE firebase_uid = ?';
      const users = await databaseConnection.query(sql, [firebaseUid]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Error finding user by Firebase UID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  static async findByEmail (email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const users = await databaseConnection.query(sql, [email]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  static async create (userData) {
    try {
      const sql = `
        INSERT INTO users (firebase_uid, email, display_name, photo_url, email_verified)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        userData.firebase_uid,
        userData.email,
        userData.display_name || null,
        userData.photo_url || null,
        userData.email_verified || false,
      ];

      await databaseConnection.query(sql, params);

      // Get the created user
      const createdUser = await this.findByFirebaseUid(userData.firebase_uid);
      logger.info('User created successfully', { uid: userData.firebase_uid });

      return createdUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user data
   * @param {string} firebaseUid - Firebase user ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  static async update (firebaseUid, updateData) {
    try {
      const sql = `
        UPDATE users 
        SET email = ?, display_name = ?, photo_url = ?, email_verified = ?
        WHERE firebase_uid = ?
      `;

      const params = [
        updateData.email,
        updateData.display_name || null,
        updateData.photo_url || null,
        updateData.email_verified || false,
        firebaseUid,
      ];

      await databaseConnection.query(sql, params);

      // Get the updated user
      const updatedUser = await this.findByFirebaseUid(firebaseUid);
      logger.info('User updated successfully', { uid: firebaseUid });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update calendar preferences for a user
   * @param {string} firebaseUid - Firebase user ID
   * @param {Array} calendarIds - Array of calendar IDs
   * @returns {Object} Updated user with calendar preferences
   */
  static async updateCalendarPreferences (firebaseUid, calendarIds) {
    try {
      // First, get the user to get the user_id
      const user = await this.findByFirebaseUid(firebaseUid);
      if (!user) {
        throw new Error('User not found');
      }

      // Get a connection for transaction
      const pool = databaseConnection.getPool();
      const connection = await pool.getConnection();

      try {
        // Start transaction
        await connection.beginTransaction();

        // Delete existing preferences for this user
        const deleteSql = 'DELETE FROM user_calendar_preferences WHERE user_id = ?';
        await connection.execute(deleteSql, [user.id]);

        // Insert new preferences
        if (calendarIds.length > 0) {
          const insertSql = `
            INSERT INTO user_calendar_preferences (user_id, calendar_id) 
            VALUES ${calendarIds.map(() => '(?, ?)').join(', ')}
          `;
          
          const insertParams = [];
          calendarIds.forEach(calendarId => {
            insertParams.push(user.id, calendarId);
          });
          
          await connection.execute(insertSql, insertParams);
        }

        // Commit transaction
        await connection.commit();

        // Get the updated user with calendar preferences
        const updatedUser = await this.findByFirebaseUid(firebaseUid);
        logger.info('Calendar preferences updated successfully', { uid: firebaseUid });

        return updatedUser;
      } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        throw error;
      } finally {
        // Release connection
        connection.release();
      }
    } catch (error) {
      logger.error('Error updating calendar preferences:', error);
      throw error;
    }
  }

  /**
   * Get calendar preferences for a user
   * @param {string} firebaseUid - Firebase user ID
   * @returns {Array} Array of calendar IDs
   */
  static async getCalendarPreferences (firebaseUid) {
    try {
      // Get the user to get the user_id
      const user = await this.findByFirebaseUid(firebaseUid);
      if (!user) {
        return [];
      }

      const sql = `
        SELECT calendar_id 
        FROM user_calendar_preferences 
        WHERE user_id = ?
        ORDER BY created_at ASC
      `;
      
      const preferences = await databaseConnection.query(sql, [user.id]);
      return preferences.map(pref => pref.calendar_id);
    } catch (error) {
      logger.error('Error getting calendar preferences:', error);
      throw error;
    }
  }

  /**
   * Find or create user (upsert)
   * @param {Object} userData - User data from Firebase
   * @returns {Object} User object
   */
  static async findOrCreate (userData) {
    try {
      // Check if user exists
      let user = await this.findByFirebaseUid(userData.uid);

      if (user) {
        // Update existing user with latest data from Firebase
        user = await this.update(userData.uid, {
          email: userData.email,
          display_name: userData.displayName,
          photo_url: userData.photoURL,
          email_verified: userData.emailVerified,
        });
        logger.info('Existing user updated', { uid: userData.uid });
      } else {
        // Create new user
        user = await this.create({
          firebase_uid: userData.uid,
          email: userData.email,
          display_name: userData.displayName,
          photo_url: userData.photoURL,
          email_verified: userData.emailVerified,
        });
        logger.info('New user created', { uid: userData.uid });
      }

      return user;
    } catch (error) {
      logger.error('Error in findOrCreate user:', error);
      throw error;
    }
  }
}

module.exports = User;
