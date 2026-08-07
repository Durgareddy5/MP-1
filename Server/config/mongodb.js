// apps/api/config/mongodb.js

import mongoose from 'mongoose';
import env from './environment.js';

const connectMongoDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,             // Maximum number of connections in the pool
      minPoolSize: 2,              // Minimum number of connections
      serverSelectionTimeoutMS: 5000,  // Timeout for server selection
      socketTimeoutMS: 45000,      // Socket timeout
      family: 4,                   // Use IPv4
    };

    const conn = await mongoose.connect(env.MONGODB_URI, options);

    console.log('✅ MongoDB connection established successfully.');
    console.log(`   📦 Database: ${conn.connection.name}`);
    console.log(`   🏠 Host: ${conn.connection.host}:${conn.connection.port}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully.');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination.');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB:', error.message);
    console.error('   Make sure MongoDB is running on the specified URI.');
    process.exit(1);
  }
};

export { connectMongoDB };
export default connectMongoDB;