/**
 * Simple logger utility for consistent logging
 */

const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta);
  },

  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  },

  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta);
    }
  },
};

module.exports = logger;
