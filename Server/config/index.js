// ============================================
// Config Index - Central Export
// ============================================

import { sequelize, initializeDatabases } from './database.js';
import * as constants from './constants.js';

export {
  sequelize,
  initializeDatabases,
  constants,
};

export default {
  sequelize,
  initializeDatabases,
  constants,
};