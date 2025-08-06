const fs = require('fs').promises;
const path = require('path');
const databaseConnection = require('../connection');
const logger = require('../../utils/logger');

async function runMigrations () {
  try {
    // Initialize database connection
    await databaseConnection.initialize();

    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '.');
    const files = await fs.readdir(migrationsDir);

    // Filter SQL files and sort them
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    logger.info(`Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      logger.info(`Running migration: ${file}`);
      await databaseConnection.query(sql);
      logger.info(`Migration completed: ${file}`);
    }

    logger.info('All migrations completed successfully');
    await databaseConnection.close();
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
