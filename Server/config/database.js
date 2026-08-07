// apps/api/config/database.js

import { connectMySQL, sequelize } from './mysql.js';
import { connectMongoDB } from './mongodb.js';

const initializeDatabases = async () => {
  console.log('\n🔄 Initializing database connections...\n');

  try {
    // Connect both databases in parallel
    await Promise.all([connectMySQL(), connectMongoDB()]);

    console.log('\n✅ All database connections established successfully.\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  📊 MySQL    → Transactional Data (Users, Orders, Portfolio)');
    console.log('  📈 MongoDB  → Market Data (Prices, Logs, Analytics)');
    console.log('═══════════════════════════════════════════════════\n');

    return { sequelize };
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

export { initializeDatabases, sequelize };
export default initializeDatabases;