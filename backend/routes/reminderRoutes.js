const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const Job = require('../models/Job');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send reminder email
async function sendReminderEmail(userEmail, jobDetails) {
    console.log('Attempting to send email to:', userEmail);
    console.log('Job details:', jobDetails);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email credentials not configured. Please check your environment variables.');
        return false;
    }

    const mailOptions = {
        from: `"JobSwpy Reminder" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Job Application Reminder: ${jobDetails.title} at ${jobDetails.company}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3b82f6;">JobSwpy Reminder</h1>
                    <p style="color: #6b7280;">This is a reminder for your job application!</p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #111827; margin-top: 0;">${jobDetails.title}</h2>
                    <p style="color: #4b5563; font-weight: bold;">${jobDetails.company}</p>
                    ${jobDetails.jobDetails.location ? `<p style="color: #6b7280;">📍    ${jobDetails.jobDetails.location}</p>` : ''}
                    ${jobDetails.jobDetails.salary ? `<p style="color: #6b7280;">💰 ${jobDetails.jobDetails.salary}</p>` : ''}
                    ${jobDetails.jobDetails.experience ? `<p style="color: #6b7280;">💼 ${jobDetails.jobDetails.experience}</p>` : ''}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #374151;">Job Description</h3>
                    <p style="color: #4b5563;">${jobDetails.description ? (jobDetails.description.substring(0, 200) + (jobDetails.description.length > 200 ? '...' : '')) : 'No description provided'}</p>
                </div>
                
                ${jobDetails.skills && jobDetails.skills.length > 0 ? `
                <div style="margin-bottom: 20px; max-width: 560px;">
                    <h3 style="color: #374151;">Required Skills</h3>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed;">
                        <tr>
                            <td style="word-break: break-word;">
                                ${jobDetails.skills.map(skill => `
                                    <div style="background-color: #e0f2fe; color: #0369a1; padding: 5px 10px; border-radius: 20px; font-size: 14px; margin: 0 5px 5px 0; display: inline-block; word-break: break-word; max-width: 100%;">
                                        ${skill}
                                    </div>
                                `).join('')}
                            </td>
                        </tr>
                    </table>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${jobDetails.applyLink}" 
                        style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Apply Now
                    </a>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p>You are receiving this email because you set a reminder for this job application on JobSwpy.</p>
                    <p>To manage your reminders, visit your profile settings in the app.</p>
                </div>
            </div>
        `
    };

    try {
        console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info);
        return true;
    } catch (error) {
        console.error('Error sending reminder email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        return false;
    }
}

// Function to check and send reminders
async function checkAndSendReminders() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('Today\'s date:', today.toISOString());

        // First, let's see all reminders in the database
        const allReminders = await Reminder.find({});

        // Find all reminders for today's date only
        const reminders = await Reminder.find({
            date: {
                $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
        });

        console.log('Date range for query:', {
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
        });
        console.log('Found reminders for today:', reminders);

        for (const reminder of reminders) {
            console.log('Processing reminder:', reminder);

            // Get job details
            const job = await Job.findById(reminder.job_id);
            if (!job) {
                console.log('Job not found for ID:', reminder.job_id);
                continue;
            }

            // Get user details
            const user = await User.findById(reminder.user_id);
            if (!user || !user.email) {
                console.log('User not found or no email for ID:', reminder.user_id);
                continue;
            }

            console.log('Sending reminder for job:', job.title, 'to user:', user.email);

            // Send reminder email
            const emailSent = await sendReminderEmail(user.email, job);

            // Delete the reminder after sending if successful
            if (emailSent) {
                await Reminder.findByIdAndDelete(reminder._id);
                console.log('Reminder deleted after successful email send');
            }
        }

        return reminders;
    } catch (error) {
        console.error('Error checking reminders:', error);
        return [];
    }
}

router.post('/setreminder', async (req, res) => {
    try {
        const { job_id, user_id, date } = req.body;
        console.log('Received reminder request:', { job_id, user_id, date });

        if (!job_id || !user_id || !date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Convert string IDs to ObjectId
        const jobObjectId = new mongoose.Types.ObjectId(job_id);
        const userObjectId = new mongoose.Types.ObjectId(user_id);

        // Convert the date string to a Date object
        const reminderDate = new Date(date);
        console.log('Converted date:', reminderDate.toISOString());

        const newReminder = new Reminder({
            job_id: jobObjectId,
            user_id: userObjectId,
            date: reminderDate
        });

        await newReminder.save();
        console.log('Saved reminder:', newReminder);
        return res.status(201).json({ message: 'Reminder set successfully' });

    } catch (error) {
        console.error('Error setting reminder:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/sendmail', async (req, res) => {
    try {
        const reminders = await checkAndSendReminders();
        console.log(reminders);
        return res.status(200).json({
            message: 'Reminder check completed'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Run reminder check every hour
setInterval(checkAndSendReminders, 60 * 60 * 1000);

module.exports = router;