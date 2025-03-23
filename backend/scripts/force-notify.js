require('dotenv').config();
const mongoose = require('mongoose');
const { triggerJobNotifications } = require('../utils/jobNotificationService');
const Job = require('../models/Job');
const User = require('../models/User');

/**
 * Force trigger notifications for all jobs in the last 30 days
 */
async function forceNotify() {
  // Connect to MongoDB with improved settings
  console.log('Connecting to MongoDB...');
  try {
    // Configure Mongoose
    mongoose.set('bufferTimeoutMS', 30000); // Increase timeout to 30 seconds

    // Get MongoDB URI from environment and verify
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    console.log(`MongoDB URI: ${mongoUri.substring(0, 20)}...`); // Show just the beginning for security

    // Connect with improved settings
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase server selection timeout
      socketTimeoutMS: 45000, // Increase socket timeout
    });
    
    console.log('Connected to MongoDB successfully');

    // Check connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready');
    }

    // Log database statistics
    try {
      // Get basic counts
      const totalJobs = await Job.countDocuments();
      const totalUsers = await User.countDocuments();
      console.log(`Total jobs in database: ${totalJobs}`);
      console.log(`Total users in database: ${totalUsers}`);
      
      // Get skills-related counts (with proper error handling)
      try {
        const usersWithSkills = await User.countDocuments({ skills: { $exists: true, $ne: [] } });
        console.log(`Users with skills: ${usersWithSkills}`);
      } catch (err) {
        console.log('Could not count users with skills');
      }
      
      // Sample jobs (with proper error handling)
      try {
        const sampleJobs = await Job.find().sort({ createdAt: -1 }).limit(3).lean();
        console.log('Sample jobs:');
        sampleJobs.forEach(job => {
          console.log(`- "${job.title}" with skills: [${job.skills?.join(', ') || 'None'}]`);
        });
      } catch (err) {
        console.log('Could not fetch sample jobs');
      }
      
      // Calculate date from 30 days ago
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 30);
      console.log(`Finding jobs since: ${daysAgo.toISOString()}`);
      
      // Run job notifications with all jobs for testing
      console.log('--- Running notification check for all jobs ---');
      const result = await triggerJobNotifications(daysAgo);
      console.log(`Results: ${result.jobs} jobs processed, ${result.notifications} notifications sent to ${result.users} unique users`);
      
      if (result.notifications === 0) {
        console.log('No notifications were sent. Possible reasons:');
        console.log('- No jobs match user skills/interests');
        console.log('- Jobs and user skills/interests don\'t overlap (check case sensitivity)');
        console.log('- No users have notifications enabled');
      }
    } catch (dbError) {
      console.error('Error performing database operations:', dbError.message);
    }
  } catch (connectionError) {
    console.error('MongoDB connection error:', connectionError.message);
  } finally {
    // Disconnect from MongoDB
    try {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError.message);
    }
  }
}

// Run the function
forceNotify()
  .then(() => console.log('Force notify process completed'))
  .catch(err => console.error('Force notify process failed:', err.message)); 