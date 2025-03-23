const nodemailer = require('nodemailer');

// Create a transporter object with more detailed verification
let transporter;

try {
  console.log('Setting up email transport with:');
  console.log(`- Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`- User: ${process.env.EMAIL_USER}`);
  console.log(`- Password: ${process.env.EMAIL_PASS ? '[CONFIGURED]' : '[NOT CONFIGURED]'}`);
  
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Verify the connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('Email transport verification failed:', error);
    } else {
      console.log('Email server is ready to send messages');
    }
  });
} catch (err) {
  console.error('Failed to create email transport:', err);
}

/**
 * Safely get a property value or return a default value if undefined
 * @param {any} obj - The object to check
 * @param {string} path - The path to the property
 * @param {any} defaultValue - The default value to return if property is undefined
 * @returns {any} - The property value or default value
 */
const safeGet = (obj, path, defaultValue = '') => {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null) return defaultValue;
      current = current[key];
    }
    
    return current === undefined || current === null ? defaultValue : current;
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Send job alert email to a user
 * @param {Object} user - User object with email and name
 * @param {Object} job - Job object with details
 * @param {Array} matchedSkills - Array of matched skills
 * @param {Array} matchedInterests - Array of matched interests
 * @returns {Promise} - Nodemailer send mail promise
 */
const sendJobAlert = async (user, job, matchedSkills = [], matchedInterests = []) => {
  if (!transporter) {
    console.error('Email transporter not initialized - cannot send emails');
    throw new Error('Email service not configured');
  }
  
  if (!user || !user.email) {
    console.error('Invalid user or missing email address');
    throw new Error('Invalid user for email notification');
  }
  
  if (!job || !job.title) {
    console.error('Invalid job or missing title');
    throw new Error('Invalid job for email notification');
  }
  
  try {
    // Debug logs
    console.log(`Attempting to send email to ${user.email} for job: ${job.title}`);
    console.log(`Using email credentials: ${process.env.EMAIL_USER} (service: ${process.env.EMAIL_SERVICE})`);
    
    // Get job details safely
    const title = safeGet(job, 'title');
    const company = safeGet(job, 'company');
    const location = safeGet(job, 'jobDetails.location') || safeGet(job, 'location', 'Remote');
    const salary = safeGet(job, 'jobDetails.salary') || safeGet(job, 'salary', 'Not specified');
    const description = safeGet(job, 'description');
    const skills = safeGet(job, 'skills', []);
    const jobId = safeGet(job, '_id');
    
    // Create email content
    const mailOptions = {
      from: `"JobSwpy Alerts" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `New Job Alert: ${title} at ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">JobSwpy Alert</h1>
            <p style="color: #6b7280;">We found a job matching your profile!</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #111827; margin-top: 0;">${title}</h2>
            <p style="color: #4b5563; font-weight: bold;">${company}</p>
            ${location ? `<p style="color: #6b7280;">${location}</p>` : ''}
            ${salary ? `<p style="color: #6b7280;">Salary: ${salary}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151;">Job Description</h3>
            <p style="color: #4b5563;">${description ? (description.substring(0, 200) + (description.length > 200 ? '...' : '')) : 'No description provided'}</p>
          </div>
          
          ${matchedSkills.length > 0 ? `
          <div style="margin-bottom: 20px; background-color: #f0fdf4; padding: 10px; border-radius: 5px; max-width: 560px;">
            <h3 style="color: #166534; margin-top: 0;">Your Matching Skills</h3>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed;">
              <tr>
                <td style="word-break: break-word;">
                  ${matchedSkills.map(skill => `
                    <div style="background-color: #dcfce7; color: #166534; padding: 5px 10px; border-radius: 20px; font-size: 14px; margin: 0 5px 5px 0; display: inline-block; word-break: break-word; max-width: 100%;">
                      ${skill}
                    </div>
                  `).join('')}
                </td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          ${matchedInterests.length > 0 ? `
          <div style="margin-bottom: 20px; background-color: #eff6ff; padding: 10px; border-radius: 5px; max-width: 560px;">
            <h3 style="color: #1e40af; margin-top: 0;">Your Matching Interests</h3>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed;">
              <tr>
                <td style="word-break: break-word;">
                  ${matchedInterests.map(interest => `
                    <div style="background-color: #dbeafe; color: #1e40af; padding: 5px 10px; border-radius: 20px; font-size: 14px; margin: 0 5px 5px 0; display: inline-block; word-break: break-word; max-width: 100%;">
                      ${interest}
                    </div>
                  `).join('')}
                </td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 20px; max-width: 560px;">
            <h3 style="color: #374151;">Skills Required</h3>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed;">
              <tr>
                <td style="word-break: break-word;">
                  ${Array.isArray(skills) && skills.length > 0 
                    ? skills.map(skill => `
                      <div style="background-color: #e0f2fe; color: #0369a1; padding: 5px 10px; border-radius: 20px; font-size: 14px; margin: 0 5px 5px 0; display: inline-block; word-break: break-word; max-width: 100%;">
                        ${skill}
                      </div>
                    `).join('') 
                    : '<p style="color: #6b7280;">No specific skills mentioned</p>'}
                </td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/job/${jobId}" 
              style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Job Details
            </a>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>You are receiving this email because you enabled job alerts for matching skills/interests on JobSwpy.</p>
            <p>To unsubscribe from these alerts, visit your profile settings in the app.</p>
          </div>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Job alert email sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending job alert email:', error);
    console.error('Error details:', error.message);
    if (error.code === 'EAUTH') {
      console.error('Authentication error - check your email credentials');
    }
    throw error;
  }
};

/**
 * Find users whose skills or interests match the job and send notifications
 * @param {Object} job - Newly created job
 * @returns {Promise<void>}
 */
const sendJobAlertToMatchingUsers = async (job) => {
  try {
    const User = require('../models/User');
    
    // Find users whose skills match the job's required skills
    const matchingUsers = await User.find({
      $or: [
        { skills: { $in: job.skills } },
        { interests: { $in: job.skills } }
      ],
      // Add any other criteria like notification preferences etc.
    });
    
    console.log(`Found ${matchingUsers.length} users matching job: ${job.title}`);
    
    // Send email notifications
    const emailPromises = matchingUsers.map(user => sendJobAlert(user, job));
    await Promise.all(emailPromises);
    
    console.log(`Job alerts sent for job: ${job.title}`);
  } catch (error) {
    console.error('Error sending job alerts to matching users:', error);
  }
};

module.exports = {
  sendJobAlert,
  sendJobAlertToMatchingUsers
}; 