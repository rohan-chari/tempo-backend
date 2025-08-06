const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

class DatabaseConnection {
  constructor () {
    this.pool = null;
  }

  /**
   * Initialize database connection pool
   */
  async initialize () {
    try {
      this.pool = mysql.createPool({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      logger.info('Database connected successfully');
      return this.pool;
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Get database pool
   */
  getPool () {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query
   */
  async query (sql, params = []) {
    const pool = this.getPool();
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close () {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection closed');
    }
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection;
