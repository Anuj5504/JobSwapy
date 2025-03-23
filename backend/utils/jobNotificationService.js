const Job = require('../models/Job');
const User = require('../models/User');
const { sendJobAlert } = require('./emailService');
const mongoose = require('mongoose');

// Variable to store the last time notifications were sent
let lastNotificationTime = new Date(0); // Initialize to epoch time

// Track users who have already received notifications today
let notifiedUsersToday = new Map(); // Map of userId -> {morningNotified: boolean, eveningNotified: boolean}

// Reset notified users tracking at midnight
const resetNotificationTracking = () => {
  const now = new Date();
  const hours = now.getHours();
  
  // Reset tracking at midnight
  if (hours === 0 && notifiedUsersToday.size > 0) {
    console.log('🔄 Midnight detected - Resetting daily notification tracking');
    notifiedUsersToday = new Map();
  }
};

// Check if it's a valid time to send notifications (around 10 AM or 10 PM)
const isValidNotificationTime = () => {
  const now = new Date();
  const hours = now.getHours();
  
  // Allow notifications around 10 AM (9 AM to 11 AM) or 10 PM (9 PM to 11 PM)
  return (hours >= 9 && hours <= 11) || (hours >= 21 && hours <= 23);
};

// Check if it's morning notification time (around 10 AM)
const isMorningTime = () => {
  const now = new Date();
  const hours = now.getHours();
  
  // Morning time is 9 AM to 11 AM
  return hours >= 9 && hours <= 11;
};

// Check if it's evening notification time (around 10 PM)
const isEveningTime = () => {
  const now = new Date();
  const hours = now.getHours();
  
  // Evening time is 9 PM to 11 PM
  return hours >= 21 && hours <= 23;
};

/**
 * Safely escape a string for use in a regular expression
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - milliseconds to sleep
 * @returns {Promise} - Promise that resolves after specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if MongoDB connection is ready
 * @returns {boolean} - True if connected, false otherwise
 */
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

/**
 * Create a safe regex pattern from an array of terms
 * @param {string[]} terms - Array of search terms 
 * @returns {RegExp|null} - Safe regex pattern or null if invalid
 */
const createSafeRegex = (terms) => {
  if (!Array.isArray(terms) || terms.length === 0) return null;
  
  try {
    // Escape special regex characters
    const escapedTerms = terms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    
    // Join with | for OR pattern
    return new RegExp(escapedTerms.join('|'), 'i');
  } catch (error) {
    console.error('Failed to create regex pattern:', error);
    return null;
  }
};

/**
 * Checks for new jobs since last check and sends notifications
 * @returns {Promise<void>}
 */
const processNewJobAlerts = async () => {
  try {
    // Check if it's a valid time to send notifications (around 10 AM or 10 PM)
    if (!isValidNotificationTime()) {
      console.log(`⏱️ Current time is not within notification windows (10 AM or 10 PM). Skipping.`);
      return;
    }
    
    // Reset tracking at midnight
    resetNotificationTracking();
    
    const currentTime = new Date();
    console.log(`Running job notification check at ${currentTime}`);
    console.log(`Looking for jobs added since ${lastNotificationTime}`);

    // Find jobs added since the last check
    const newJobs = await Job.find({
      createdAt: { $gt: lastNotificationTime }
    });

    console.log(`Found ${newJobs.length} new jobs since last check`);
    
    if (newJobs.length === 0) {
      console.log('No new jobs found. Skipping notifications.');
      return;
    }

    // Display job info for debugging
    newJobs.forEach((job, index) => {
      console.log(`Job ${index + 1}: ${job.title} (Skills: ${job.skills?.join(', ') || 'None'})`);
    });

    // For each new job, find matching users and send notifications
    for (const job of newJobs) {
      // Find users whose skills or interests match the job
      if (!job.skills || job.skills.length === 0) {
        console.log(`Job ${job.title} has no skills defined. Skipping.`);
        continue;
      }
      
      const matchingUsers = await User.find({
        $or: [
          { skills: { $in: job.skills } },
          { interests: { $in: job.skills } }
        ]
      });

      console.log(`Job: ${job.title} - Found ${matchingUsers.length} matching users`);

      // Display matching users for debugging
      if (matchingUsers.length > 0) {
        matchingUsers.forEach((user, index) => {
          console.log(`Matching user ${index + 1}: ${user.email} (Skills: ${user.skills?.join(', ') || 'None'})`);
        });
      } else {
        console.log('No matching users found for this job.');
      }

      // Send notifications to each matching user
      for (const user of matchingUsers) {
        try {
          const userId = user._id.toString();
          
          // Check if user has already been notified today
          if (!notifiedUsersToday.has(userId)) {
            notifiedUsersToday.set(userId, { 
              morningNotified: false,
              eveningNotified: false
            });
          }
          
          const userNotifications = notifiedUsersToday.get(userId);
          
          // Determine if we should send a notification based on time of day
          let shouldSendNotification = false;
          
          if (isMorningTime() && !userNotifications.morningNotified) {
            userNotifications.morningNotified = true;
            shouldSendNotification = true;
            console.log(`Morning notification time for user ${user.email}`);
          } else if (isEveningTime() && !userNotifications.eveningNotified) {
            userNotifications.eveningNotified = true;
            shouldSendNotification = true;
            console.log(`Evening notification time for user ${user.email}`);
          }
          
          // Update the tracking map
          notifiedUsersToday.set(userId, userNotifications);
          
          if (shouldSendNotification) {
            await sendJobAlert(user, job);
            console.log(`Sent notification to ${user.email} for job: ${job.title}`);
          } else {
            console.log(`Skipped notification for ${user.email} - already received today's notification for this time period`);
          }
        } catch (error) {
          console.error(`Failed to send notification to ${user.email}:`, error.message);
        }
      }
    }

    // Update the last notification time to current time
    lastNotificationTime = currentTime;
    console.log(`Updated last notification time to ${lastNotificationTime}`);
  } catch (error) {
    console.error('Error processing job notifications:', error);
  }
};

/**
 * Checks for new jobs and sends notifications to matching users
 * Send a notification for a relevant job that matches a user's skills/interests
 * @param {Date} since - Check for jobs created since this date (default: last 24 hours)
 * @returns {Object} - Statistics about notifications sent
 */
const triggerJobNotifications = async (since = new Date(Date.now() - 24 * 60 * 60 * 1000)) => {
  console.log(`⏳ Checking for job notifications since ${since.toISOString()}`);
  
  // First check if MongoDB is connected to prevent timeout issues
  if (!isMongoConnected()) {
    console.error('❌ MongoDB is not connected. Aborting job notifications.');
    return { jobs: 0, notifications: 0, users: 0 };
  }
  
  // Reset tracking at midnight
  resetNotificationTracking();
  
  // Skip if it's not a valid notification time (unless it's a forced run)
  const isForced = since.getTime() < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).getTime();
  
  if (!isValidNotificationTime() && !isForced) {
    console.log(`⏱️ Current time is not within notification windows (10 AM or 10 PM). Skipping.`);
    return { jobs: 0, notifications: 0, users: 0 };
  }
  
  const isMorning = isMorningTime();
  const isEvening = isEveningTime();
  
  console.log(`Current time period: ${isMorning ? 'Morning (around 10 AM)' : isEvening ? 'Evening (around 10 PM)' : 'Outside notification windows'}`);
  
  try {
    // Find users with skills or interests who have notifications enabled
    const users = await User.find({
      notificationsEnabled: { $ne: false },
      $or: [
        { skills: { $exists: true, $ne: [] } },
        { interests: { $exists: true, $ne: [] } }
      ]
    }).lean().exec(); // Use lean() for better performance and exec() to ensure Promise
    
    console.log(`📊 Found ${users.length} users with skills/interests and notifications enabled`);
    
    if (users.length === 0) {
      console.log('⚠️ No eligible users found with skills/interests and notifications enabled');
      return { jobs: 0, notifications: 0, users: 0 };
    }
    
    // Get all jobs to work with (excluding test position)
    const allJobs = await Job.find({
      title: { $ne: "Software Developer - Test Position" } // Exclude the test position
    }).lean().exec(); // Use lean() for better performance and exec() to ensure Promise
    
    console.log(`📊 Found ${allJobs.length} total valid jobs (excluding test positions)`);
    
    if (allJobs.length === 0) {
      console.log('⚠️ No valid jobs found (excluding test positions)');
      return { jobs: 0, notifications: 0, users: 0 };
    }
    
    // Log some details about the jobs for debugging
    console.log('🔍 Sample of available jobs with skills:');
    allJobs.slice(0, 5).forEach((job, index) => {
      console.log(`  Job ${index + 1}: "${job.title}" - Skills: [${job.skills?.join(', ') || 'None'}]`);
    });
    
    let totalNotifications = 0;
    const notifiedUsers = new Set();
    const processedJobs = new Set();
    
    // Process each user 
    for (const user of users) {
      try {
        const userId = user._id.toString();
        
        // Check if user has already been notified today for this time period
        if (!notifiedUsersToday.has(userId)) {
          notifiedUsersToday.set(userId, { 
            morningNotified: false,
            eveningNotified: false
          });
        }
        
        const userNotifications = notifiedUsersToday.get(userId);
        
        // Determine if we should send a notification based on time of day
        let shouldSendNotification = false;
        
        if (isMorning && !userNotifications.morningNotified) {
          userNotifications.morningNotified = true;
          shouldSendNotification = true;
          console.log(`Morning notification time for user ${user.email}`);
        } else if (isEvening && !userNotifications.eveningNotified) {
          userNotifications.eveningNotified = true;
          shouldSendNotification = true;
          console.log(`Evening notification time for user ${user.email}`);
        } else if (isForced) {
          // For forced runs (like manually triggered ones), always send
          shouldSendNotification = true;
          console.log(`Forced notification for user ${user.email}`);
        }
        
        // Update the tracking map
        notifiedUsersToday.set(userId, userNotifications);
        
        if (!shouldSendNotification && !isForced) {
          console.log(`👤 Skipping user ${user.email} - already received today's notification for this time period`);
          continue;
        }
        
        // Get user skills and interests
        const userSkills = user.skills || [];
        const userInterests = user.interests || [];
        
        console.log(`👤 Processing user: ${user.email}`);
        console.log(`   Skills: [${userSkills.join(', ') || 'None'}]`);
        
        if (userSkills.length === 0 && userInterests.length === 0) {
          console.log(`   ⚠️ User has no skills or interests defined, skipping`);
          continue;
        }
        
        // Very simple direct matching - find jobs that share at least one skill with the user
        const matchingJobs = [];
        
        for (const job of allJobs) {
          const jobSkills = job.skills || [];
          
          if (jobSkills.length === 0) {
            continue; // Skip jobs with no skills
          }
          
          // Convert skills to lowercase for case-insensitive matching
          const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase());
          const normalizedUserSkills = userSkills.map(skill => skill.toLowerCase());
          
          // Check for skill overlap (case-insensitive)
          const hasSkillOverlap = normalizedUserSkills.some(skill => 
            normalizedJobSkills.includes(skill)
          );
          
          if (hasSkillOverlap) {
            matchingJobs.push(job);
          }
        }
        
        if (matchingJobs.length === 0) {
          console.log(`   ⚠️ No matching jobs found, skipping notification`);
          continue;
        }
        
        console.log(`   Found ${matchingJobs.length} matching jobs for this user`);
        
        // Select a job randomly for variety
        const randomJob = matchingJobs[Math.floor(Math.random() * matchingJobs.length)];
        const jobSkills = randomJob.skills || [];
        
        // Find matched skills (case-insensitive)
        const matchedSkills = userSkills.filter(skill => 
          jobSkills.some(jobSkill => jobSkill.toLowerCase() === skill.toLowerCase())
        );
        
        console.log(`   Selected job "${randomJob.title}" for notification`);
        console.log(`   Matched skills: [${matchedSkills.join(', ')}]`);
        
        // Send email with small delay
        console.log(`   📧 Sending notification to ${user.email}`);
        await sleep(2000); // 2 seconds delay
        
        // Send email alert with only matched skills
        await sendJobAlert(user, randomJob, matchedSkills, []);
        
        // Update statistics
        totalNotifications++;
        notifiedUsers.add(userId);
        processedJobs.add(randomJob._id.toString());
        
        console.log(`   ✅ Successfully sent notification to ${user.email}`);
      } catch (userError) {
        console.error(`❌ Error processing notifications for user ${user.email}:`, userError);
      }
    }
    
    // Return statistics
    console.log(`📊 NOTIFICATION SUMMARY:`);
    console.log(`   Jobs processed: ${processedJobs.size}`);
    console.log(`   Notifications sent: ${totalNotifications}`);
    console.log(`   Unique users notified: ${notifiedUsers.size}`);
    
    return {
      jobs: processedJobs.size,
      notifications: totalNotifications,
      users: notifiedUsers.size
    };
  } catch (error) {
    console.error('❌ Error in triggerJobNotifications:', error);
    return { jobs: 0, notifications: 0, users: 0 }; // Return empty stats instead of throwing
  }
};

// Schedule to run every hour (in a production environment)
// Note: In a real application, you should use a proper job scheduler like node-cron
// setInterval(processNewJobAlerts, 60 * 60 * 1000); // Run every hour

module.exports = { 
  triggerJobNotifications
}; 