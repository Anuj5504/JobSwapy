require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const { sendJobAlert } = require('./utils/emailService');

// Test function to check if the email service is working
async function testEmailSending() {
  try {
    console.log('==== Testing Email Configuration ====');
    console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '******' : 'NOT SET'}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    
    // Find a user with skills and interests
    console.log('\nFinding a user with skills/interests...');
    const user = await User.findOne({
      $or: [
        { skills: { $exists: true, $ne: [] } },
        { interests: { $exists: true, $ne: [] } }
      ]
    });
    
    if (!user) {
      console.error('No users found with skills or interests');
      return;
    }
    
    console.log(`Found user: ${user.name || user.email}`);
    console.log(`User skills: ${user.skills?.join(', ') || 'None'}`);
    console.log(`User interests: ${user.interests?.join(', ') || 'None'}`);
    
    // Find or create a sample job for testing
    console.log('\nFinding a job with matching skills...');
    
    // Try to find an existing job with skills that match the user
    let job = null;
    if (user.skills && user.skills.length > 0) {
      job = await Job.findOne({
        skills: { $in: user.skills }
      });
    }
    
    // If no matching job found, get any job
    if (!job) {
      job = await Job.findOne();
      
      if (!job) {
        console.error('No jobs found in the database');
        return;
      }
      
      // Add user skills to this job for testing purposes
      if (user.skills && user.skills.length > 0) {
        job.skills = job.skills || [];
        job.skills = [...new Set([...job.skills, ...user.skills])];
        console.log('Updated job with user skills for testing purposes');
      }
    }
    
    console.log(`Test job: ${job.title} at ${job.company}`);
    console.log(`Job skills: ${job.skills?.join(', ') || 'None'}`);
    
    // Send a test email
    console.log('\nSending test email...');
    try {
      await sendJobAlert(user, job);
      console.log(`✅ Test email sent successfully to ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to send test email: ${error.message}`);
      if (error.code === 'EAUTH') {
        console.error('This is an authentication error. Check your email password and make sure you\'re using an app password for Gmail.');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the test
testEmailSending(); 