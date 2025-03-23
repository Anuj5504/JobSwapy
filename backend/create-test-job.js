require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

const createTestJob = async () => {
  try {
    // Create a job with common skills
    const testJob = new Job({
      title: 'Software Developer - Test Position',
      company: 'JobSwpy Test Company',
      description: 'This is a test job created to test the notification system. This position requires skills in JavaScript, React, Node.js and MongoDB.',
      source: 'test',
      applyLink: 'https://example.com/apply',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
      jobDetails: {
        experience: '1-3 years',
        salary: '$80,000 - $100,000',
        location: 'Remote',
        employmentType: 'Full-time',
        postedDate: new Date().toISOString(),
      }
    });

    // Save the job
    const savedJob = await testJob.save();
    console.log('Test job created successfully:', savedJob);
    
    // Get all jobs from the last hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    
    const recentJobs = await Job.find({
      createdAt: { $gte: lastHour }
    });
    
    console.log(`Found ${recentJobs.length} jobs created in the last hour`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error creating test job:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
createTestJob(); 