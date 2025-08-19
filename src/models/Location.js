const db = require('../database/connection');
const logger = require('../utils/logger');

class Location {
  /**
   * Create a new location
   * @param {Object} locationData - Location data
   * @returns {Object} Created location
   */
  static async create(locationData) {
    const {
      user_id,
      google_place_id,
      name,
      address,
      latitude,
      longitude,
      types
    } = locationData;

    const query = `
      INSERT INTO user_locations 
      (user_id, google_place_id, name, address, latitude, longitude, types)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      address = VALUES(address),
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      types = VALUES(types),
      updated_at = CURRENT_TIMESTAMP
    `;

    const values = [
      user_id,
      google_place_id,
      name,
      address || null,
      latitude || null,
      longitude || null,
      types ? JSON.stringify(types) : null
    ];

    try {
      const result = await db.query(query, values);
      return result;
    } catch (error) {
      throw new Error(`Error creating location: ${error.message}`);
    }
  }

  /**
   * Create multiple locations
   * @param {Array} locations - Array of location data
   * @returns {Object} Result
   */
  static async createMultiple(locations) {
    if (!locations || locations.length === 0) {
      return { success: true, count: 0 };
    }

    const pool = db.getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const location of locations) {
        await this.create(location);
      }

      await connection.commit();
      return { success: true, count: locations.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }


  /**
   * Find locations by user ID
   * @param {number} userId - User ID
   * @returns {Array} Array of locations
   */
  static async findByUserId(userId) {
    const query = `
      SELECT * FROM user_locations 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    try {
      const rows = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding locations by user ID: ${error.message}`);
    }
  }

  /**
   * Find locations by user ID and search query with fuzzy matching
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @returns {Array} Array of matching locations with relevance scoring
   */
  static async findByUserIdAndQuery(userId, query) {
    const searchQuery = `
      SELECT *,
        CASE
          -- Exact matches (highest priority)
          WHEN LOWER(name) = LOWER(?) THEN 100
          WHEN LOWER(address) LIKE LOWER(?) THEN 95
          
          -- Starts with matches
          WHEN LOWER(name) LIKE LOWER(?) THEN 90
          WHEN LOWER(address) LIKE LOWER(?) THEN 85
          
          -- Contains matches
          WHEN LOWER(name) LIKE LOWER(?) THEN 80
          WHEN LOWER(address) LIKE LOWER(?) THEN 75
          
          -- Word boundary matches
          WHEN LOWER(name) REGEXP LOWER(?) THEN 70
          WHEN LOWER(address) REGEXP LOWER(?) THEN 65
          
          -- Type matches (restaurant, cafe, etc.)
          WHEN JSON_SEARCH(LOWER(types), 'one', LOWER(?)) IS NOT NULL THEN 60
          
          -- Soundex matches (phonetic similarity)
          WHEN SOUNDEX(name) = SOUNDEX(?) THEN 50
          
          ELSE 0
        END as relevance_score
      FROM user_locations 
      WHERE user_id = ? 
      AND (
        -- Basic text matching
        LOWER(name) LIKE LOWER(?) OR 
        LOWER(address) LIKE LOWER(?) OR
        
        -- Word boundary matching
        LOWER(name) REGEXP LOWER(?) OR
        LOWER(address) REGEXP LOWER(?) OR
        
        -- Type matching
        JSON_SEARCH(LOWER(types), 'one', LOWER(?)) IS NOT NULL OR
        
        -- Soundex matching
        SOUNDEX(name) = SOUNDEX(?) OR
        
        -- Individual word matching
        LOWER(name) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?)
      )
      ORDER BY relevance_score DESC, created_at DESC
    `;

    // Prepare search terms for different matching strategies
    const exactTerm = query;
    const wildcardTerm = `%${query}%`;
    const startsTerm = `${query}%`;
    const wordBoundaryTerm = `\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
    const individualWords = query.split(' ').map(word => `%${word}%`);

    try {
      const params = [
        // Exact matches
        exactTerm, exactTerm,
        
        // Starts with matches  
        startsTerm, startsTerm,
        
        // Contains matches
        wildcardTerm, wildcardTerm,
        
        // Word boundary matches
        wordBoundaryTerm, wordBoundaryTerm,
        
        // Type matches
        wildcardTerm,
        
        // Soundex matches
        exactTerm,
        
        // User ID for WHERE clause
        userId,
        
        // WHERE clause conditions (repeated)
        wildcardTerm, wildcardTerm,
        wordBoundaryTerm, wordBoundaryTerm,
        wildcardTerm,
        exactTerm,
        individualWords[0] || wildcardTerm,
        individualWords[0] || wildcardTerm
      ];

      const rows = await db.query(searchQuery, params);
      
      // Filter out results with very low relevance scores
      const filteredRows = rows.filter(row => row.relevance_score > 0);
      


      return filteredRows;
    } catch (error) {
      // Fallback to simple search if complex query fails
      logger.warn('Fuzzy search failed, falling back to simple search', {
        userId,
        query,
        error: error.message
      });
      
      return this.findByUserIdAndQuerySimple(userId, query);
    }
  }

  /**
   * Simple fallback search method
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @returns {Array} Array of matching locations
   */
  static async findByUserIdAndQuerySimple(userId, query) {
    const searchQuery = `
      SELECT * FROM user_locations 
      WHERE user_id = ? 
      AND (LOWER(name) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?))
      ORDER BY created_at DESC
    `;

    const searchTerm = `%${query}%`;

    try {
      const rows = await db.query(searchQuery, [userId, searchTerm, searchTerm]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding locations by query: ${error.message}`);
    }
  }

  /**
   * Find location by Google Place ID and user ID
   * @param {string} googlePlaceId - Google Place ID
   * @param {number} userId - User ID
   * @returns {Object|null} Location or null
   */
  static async findByGooglePlaceId(googlePlaceId, userId) {
    const query = `
      SELECT * FROM user_locations 
      WHERE google_place_id = ? AND user_id = ?
    `;

    try {
      const rows = await db.query(query, [googlePlaceId, userId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding location by Google Place ID: ${error.message}`);
    }
  }




}

module.exports = Location;
