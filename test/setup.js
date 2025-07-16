const mongoose = require('mongoose');

// Setup MongoDB connection for tests
module.exports = async () => {
  // In Docker environment, we need to use the service name 'mongodb' instead of 'localhost'
  // The MONGODB_URI environment variable is set in the Dockerfile
  const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/feathers-mongoose-test';
  console.log('Connecting to MongoDB at:', mongodbUri);

  // Set strictQuery to false to suppress deprecation warning
  mongoose.set('strictQuery', false);

  try {
    // Connect to MongoDB with increased timeout
    await mongoose.connect(mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      // Required for MongoDB replica sets
      replicaSet: 'rs0'
    });

    // Test the connection
    console.log('MongoDB connected successfully');

    // Return the mongoose instance for use in tests
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
