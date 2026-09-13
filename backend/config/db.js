import mongoose from 'mongoose';

/**
 * Connect to MongoDB database.
 * Fails loudly and terminates server process if connection fails or DATABASE_URL is missing.
 */
export const connectDB = async () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ [FATAL DATABASE ERROR] DATABASE_URL is missing in environment variables!');
    console.error('TaskBuddy requires a real MongoDB connection. No local file fallback is permitted.');
    console.error('Please configure DATABASE_URL in backend/.env (e.g. mongodb://localhost:27017/taskbuddy)');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }

  // Already connected — skip to avoid parallel test race conditions on the shared Mongoose singleton
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ [FATAL DATABASE ERROR] Could NOT connect to MongoDB!');
    console.error(`Target URI : ${dbUrl}`);
    console.error(`Error      : ${error.message}`);
    console.error('\nNo local fallback is used. Please ensure:');
    console.error('  1. MongoDB is installed and running (run `mongod` or start MongoDB service)');
    console.error('  2. Or provide a valid MongoDB Atlas connection string in backend/.env');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
};

