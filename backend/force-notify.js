require('dotenv').config();
const mongoose = require('mongoose');
const { triggerJobNotifications } = require('./utils/jobNotificationService');

async function forceNotify() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get date from 30 days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`Running notifications for all jobs since ${startDate.toISOString()}`);
    
    // Trigger notifications for all jobs in the past 30 days
    const result = await triggerJobNotifications(startDate);
    
    console.log('==========================================');
    console.log('Notification results:');
    console.log('==========================================');
    console.log(`Jobs processed: ${result.jobsProcessed}`);
    console.log(`Notifications sent: ${result.notificationsSent}`);
    console.log(`Unique users notified: ${result.uniqueUsersNotified}`);
    console.log('==========================================');
    
    if (result.jobsProcessed === 0) {
      console.log('No jobs found in the last 30 days. Try adding a new job and run this again.');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

forceNotify(); 