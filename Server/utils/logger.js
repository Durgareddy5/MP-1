// apps/api/utils/logger.js

import env from '../config/environment.js';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const CURRENT_LEVEL = env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

const colorize = (level, message) => {
  const colors = {
    ERROR: '\x1b[31m',   // Red
    WARN: '\x1b[33m',    // Yellow
    INFO: '\x1b[36m',    // Cyan
    DEBUG: '\x1b[35m',   // Magenta
  };
  const reset = '\x1b[0m';
  return `${colors[level] || ''}${message}${reset}`;
};

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
  error: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(colorize('ERROR', formatLog('ERROR', message, meta)));
    }
  },

  warn: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(colorize('WARN', formatLog('WARN', message, meta)));
    }
  },

  info: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      console.log(colorize('INFO', formatLog('INFO', message, meta)));
    }
  },

  debug: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(colorize('DEBUG', formatLog('DEBUG', message, meta)));
    }
  },

  // Special trading log
  trade: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[32m[${timestamp}] [TRADE] ${message}\x1b[0m`, meta);
  },
};

export default logger;