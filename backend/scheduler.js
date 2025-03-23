require('dotenv').config();
const cron = require('node-cron');
const mongoose = require('mongoose');
const { triggerJobNotifications } = require('./utils/jobNotificationService');

// Import database connection from main app
let dbConnection;
try {
  const app = require('./index');
  dbConnection = app.dbConnection;
  console.log('📅 Job notification scheduler initialized with shared database connection');
} catch (error) {
  console.error('⚠️ Could not import database connection from main app:', error.message);
  console.log('📅 Job notification scheduler will use its own connection check');
}

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

// Log scheduler status
console.log(`📊 JOB NOTIFICATION STATUS: ENABLED`);
console.log(`⏱️ Schedule: Twice daily at 10 AM and 10 PM`);

// Schedule job notifications to run at 10:00 AM and 10:00 PM every day
// '0 10,22 * * *' = At 10:00 AM and 10:00 PM, every day
const jobNotificationsSchedule = cron.schedule('0 10,22 * * *', async () => {
  console.log(`🔔 Running scheduled job notifications check at ${new Date().toISOString()}`);
  
  // Check MongoDB connection before proceeding
  if (!isMongoConnected()) {
    console.error('❌ MongoDB is not connected. Skipping scheduled job notifications.');
    return;
  }
  
  try {
    // Check for jobs in the last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const result = await triggerJobNotifications(twelveHoursAgo);
    console.log(`✅ Job notifications completed: ${result.notifications} notifications sent to ${result.users} users`);
  } catch (error) {
    console.error('❌ Error running scheduled job notifications:', error);
  }
});

// Also run immediately when server starts, but wait for DB connection
console.log('🚀 Will run initial job notifications check after MongoDB connection is established');

// Use a longer delay to ensure MongoDB connection is ready
const initialCheckDelay = 15000; // 15 seconds

setTimeout(async () => {
  // Check MongoDB connection before proceeding
  if (!isMongoConnected()) {
    console.error('❌ MongoDB is not connected. Skipping initial job notifications check.');
    return;
  }
  
  console.log('🚀 Running initial job notifications check...');
  try {
    // Initial check - look at jobs from the last 7 days, but respect the time window
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await triggerJobNotifications(sevenDaysAgo);
    console.log(`✅ Initial job notifications completed: ${result.notifications} notifications sent to ${result.users} users`);
  } catch (error) {
    console.error('❌ Error running initial job notifications:', error);
  }
}, initialCheckDelay);

// Start the scheduler
jobNotificationsSchedule.start();
console.log('✅ Job notification scheduler started successfully');

module.exports = { jobNotificationsSchedule }; 