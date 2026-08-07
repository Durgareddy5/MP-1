// apps/api/config/mysql.js

import { Sequelize } from 'sequelize';
import env from './environment.js';

const sequelize = new Sequelize(
  env.MYSQL_DATABASE,
  env.MYSQL_USER,
  env.MYSQL_PASSWORD,
  {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    dialect: 'mysql',
    logging: env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: env.MYSQL_POOL_MAX,
      min: env.MYSQL_POOL_MIN,
      acquire: 30000,    // Maximum time (ms) to try getting a connection
      idle: 10000,       // Maximum time (ms) a connection can be idle
    },
    define: {
      timestamps: true,   // Adds createdAt and updatedAt
      underscored: true,  // Uses snake_case for auto-generated fields
      freezeTableName: true, // Prevents Sequelize from pluralizing table names
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    timezone: '+05:30', // IST for Indian Stock Market
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      connectTimeout: 10000,
    },
  }
);

// Test connection function
const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
    console.log(`   📦 Database: ${env.MYSQL_DATABASE}`);
    console.log(`   🏠 Host: ${env.MYSQL_HOST}:${env.MYSQL_PORT}`);

    // Sync all models (creates tables if they don't exist)
    // In production, use migrations instead
    if (env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('✅ MySQL tables synchronized (alter mode).');
    }

    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
    console.error('   Make sure MySQL is running and credentials are correct.');
    process.exit(1);
  }
};

export { sequelize, connectMySQL };
export default sequelize;