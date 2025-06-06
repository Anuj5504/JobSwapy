const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Job = require('../models/Job');
const mongoose = require('mongoose');
const { triggerJobNotifications } = require('../utils/jobNotificationService');

// Import all controller functions
const {
  getJobs,
  getJobById,
  getSimilarJobs,
  recordJobApplication,
  getJobStats,
  checkUserJobInteraction
} = require('../controllers/jobController');

// Basic job routes
router.get('/', getJobs);
router.get('/:id',getJobById);
router.get('/similar/:id', getSimilarJobs);

// Job interaction routes
router.post('/:jobId/apply', authenticateToken, recordJobApplication);
router.get('/:jobId/stats', getJobStats);
router.get('/:jobId/user-interaction', authenticateToken, checkUserJobInteraction);

// Get personalized recommendations
router.get('/getRecommendation/:id', async (req, res) => {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Build base query for recommendations
      const baseQuery = {
        $or: [
          { skills: { $in: user.skills } },
          { $or: user.skills.map(skill => ({ title: { $regex: skill, $options: "i" } })) }
        ]
      };

      // Build additional filters similar to getJobs
      const additionalFilters = {};

      // Handle search query (title, company, description)
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        additionalFilters.$or = [
          { title: searchRegex },
          { company: searchRegex },
          { description: searchRegex }
        ];
      }

      // Handle location filter
      if (req.query.location) {
        additionalFilters['jobDetails.location'] = new RegExp(req.query.location, 'i');
      }

      // Handle work type filter (remote, hybrid, office)
      if (req.query.workType) {
        const workTypes = req.query.workType.split(',').filter(Boolean);
        if (workTypes.length > 0) {
          // Create or conditions for each work type
          const workTypeConditions = [];
          
          if (workTypes.includes('remote')) {
            // Remote includes "work from home" or "remote" in employment type or description
            workTypeConditions.push({ 
              $or: [
                { 'jobDetails.employmentType': new RegExp('remote|work\\s*from\\s*home|wfh', 'i') },
                { 'description': new RegExp('remote|work\\s*from\\s*home|wfh', 'i') }
              ]
            });
          }
          
          if (workTypes.includes('hybrid')) {
            // Hybrid includes "hybrid" in employment type or description
            workTypeConditions.push({ 
              $or: [
                { 'jobDetails.employmentType': new RegExp('hybrid', 'i') },
                { 'description': new RegExp('hybrid', 'i') }
              ]
            });
          }
          
          if (workTypes.includes('office')) {
            // Office is anything that doesn't match remote or hybrid patterns
            workTypeConditions.push({ 
              $and: [
                { 'jobDetails.employmentType': { $not: new RegExp('remote|work\\s*from\\s*home|wfh|hybrid', 'i') } },
                { 'description': { $not: new RegExp('remote|work\\s*from\\s*home|wfh|hybrid', 'i') } }
              ]
            });
          }
          
          if (workTypeConditions.length > 0) {
            additionalFilters.$or = additionalFilters.$or || [];
            // Combine with existing OR conditions
            additionalFilters.$or.push(...workTypeConditions);
          }
        }
      }

      // Handle source filter (linkedin, indeed, glassdoor, naukri, internshala)
      if (req.query.source) {
        const sources = req.query.source.split(',').filter(Boolean);
        if (sources.length > 0) {
          additionalFilters.source = { $in: sources.map(source => new RegExp(source, 'i')) };
        }
      }

      // Handle skills filter
      if (req.query.skills) {
        additionalFilters.skills = { $in: req.query.skills.split(',').map(skill => new RegExp(skill.trim(), 'i')) };
      }

      // Combine base recommendation query with additional filters
      const finalQuery = Object.keys(additionalFilters).length > 0
        ? { $and: [baseQuery, additionalFilters] }
        : baseQuery;
      
      // Get total count for pagination
      const totalRecommendations = await Job.countDocuments(finalQuery);
      
      // Query with pagination and filters based on sort parameter
      let recommendations;
      const sortParam = req.query.sort || '';
      
      if (sortParam === 'ranking') {
        // Sort by ranking score using aggregation
        const rankingResults = await Job.aggregate([
          { $match: finalQuery },
          { $addFields: {
              // Calculate ranking score using weighted formula
              rankingScore: {
                $add: [
                  { $multiply: [{ $ifNull: ["$appliedCount", 0] }, 5] },
                  { $multiply: [{ $ifNull: ["$savedCount", 0] }, 3] },
                  { $multiply: [{ $ifNull: ["$viewCount", 0] }, 1] }
                ]
              }
            }
          },
          { $sort: { rankingScore: -1 } },
          { $skip: skip },
          { $limit: limit }
        ]);
        
        recommendations = rankingResults;
      } else {
        // Default sort by posted date
        recommendations = await Job.find(finalQuery)
          .sort({ 'jobDetails.postedDate': -1 })
          .skip(skip)
          .limit(limit);
      }
      
      // Handle skill match percentage if provided
      let jobsWithMatchPercentage = recommendations;
      let filteredCount = totalRecommendations;
      
      // Always calculate the skill match percentage for recommendations
      if (user.skills && user.skills.length > 0) {
        // Calculate match percentage for each job
        jobsWithMatchPercentage = recommendations.map(job => {
          const jobObj = sortParam === 'ranking' ? job : job.toObject();
          const jobSkills = jobObj.skills || [];
          
          // Find exact matches between user skills and job skills
          const matchedSkills = user.skills.filter(skill => 
            jobSkills.some(jobSkill => 
              typeof jobSkill === 'string' && 
              typeof skill === 'string' && 
              jobSkill.toLowerCase() === skill.toLowerCase()
            )
          );
          
          // Calculate percentage based on job's required skills
          const matchPercentage = jobSkills.length > 0 
            ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
            : 0;
          
          // Add match percentage to job object
          return {
            ...jobObj,
            skillMatchPercentage: matchPercentage
          };
        });
        
        // If a minimum match percentage is specified, filter the results
        if (req.query.skillMatchPercentage && parseInt(req.query.skillMatchPercentage) > 0) {
          const minPercentage = parseInt(req.query.skillMatchPercentage);
          const filteredJobs = jobsWithMatchPercentage.filter(job => job.skillMatchPercentage >= minPercentage);
          
          // Update jobs and count
          jobsWithMatchPercentage = filteredJobs;
          filteredCount = filteredJobs.length;
        } else if (req.query.skillMatchMin && req.query.skillMatchMax) {
          // Filter by range
          const minMatch = parseInt(req.query.skillMatchMin);
          const maxMatch = parseInt(req.query.skillMatchMax);
          const filteredJobs = jobsWithMatchPercentage.filter(job => 
            job.skillMatchPercentage >= minMatch && job.skillMatchPercentage <= maxMatch
          );
          
          // Update jobs and count
          jobsWithMatchPercentage = filteredJobs;
          filteredCount = filteredJobs.length;
        }
      }
      
      const totalPages = Math.ceil(filteredCount / limit);

      res.status(200).json({
        success: true,
        count: jobsWithMatchPercentage.length,
        pagination: {
          total: filteredCount,
          pages: totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          totalDocs: filteredCount
        },
        data: jobsWithMatchPercentage
      });
  
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ 
        success: false,
        message: "Server error while fetching recommendations" 
      });
    }
});

// Main save/unsave job routes - integrates with Job model's savedBy array and savedCount fields
router.post('/savejob/:jobid/:userid', async (req, res) => {
    try {
        const jobId = req.params.jobid;
        const userId = req.params.userid;
           
        if (!userId) {
          return res.status(404).json({ message: "User not found" });
        }
    
        const job = await Job.findById(jobId);
    
        if(!job){
          return res.status(404).json({message:"Invalid id"});
        }
    
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $addToSet: { savedJobs: jobId } },
          { new: true }
        );

        // Update Job model: add userId to savedBy array and increment savedCount by 1
        await Job.findByIdAndUpdate(jobId, {
          $addToSet: { savedBy: userId },
          $inc: { savedCount: 1 }
        });
        
        res.status(200).json({
          success: true,
          message: "Job saved successfully",
          updatedUser
        });
    
    } catch (error) {
      console.error('Error saving job:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed saving job" 
      });
    }
});

// Route to unsave a job (remove from saved jobs)
router.delete('/unsavejob/:jobid/:userid', async (req, res) => {
  try {
    const jobId = req.params.jobid;
    const userId = req.params.userid;
    
    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Remove job from user's saved jobs
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedJobs: jobId } },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update Job model: remove userId from savedBy array and decrement savedCount by 1
    await Job.findByIdAndUpdate(jobId, {
      $pull: { savedBy: userId },
      $inc: { savedCount: -1 }
    });
    
    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
      updatedUser
    });
  } catch (error) {
    console.error('Error unsaving job:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove job from saved jobs" 
    });
  }
});

// For jobs without user (non-personalized)
router.get('/swipe', async (req, res) => {
  try {
    // Fetch a random selection of jobs limited to 20
    const randomJobs = await Job.aggregate([
      { $sample: { size: 20 } } // Get 20 random jobs
    ]);

    res.status(200).json({
      success: true,
      count: randomJobs.length,
      data: randomJobs
    });
  } catch (error) {
    console.error('Error fetching swipe jobs:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching jobs for swiping" 
    });
  }
});

// For jobs with user ID (personalized)
router.get('/swipe/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let jobs;
    // If user has skills, find jobs matching those skills
    if (user.skills && user.skills.length > 0) {
      jobs = await Job.find({
        $or: [
          { skills: { $in: user.skills } },
          { $or: user.skills.map(skill => ({ title: { $regex: skill, $options: "i" } })) }
        ]
      }).limit(20); // Limit to 20 jobs
    } else {
      // If no skills defined, get random jobs
      jobs = await Job.aggregate([
        { $sample: { size: 20 } }
      ]);
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching personalized swipe jobs:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching personalized jobs for swiping" 
    });
  }
});

// Trigger job notifications for all users with matching skills/interests
router.post('/send-notifications', authenticateToken, async (req, res) => {
  try {
    // Optional: Check if user has admin privileges
    // const user = await User.findById(req.userId);
    // if (!user || !user.isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    
    // Get the start time for checking new jobs
    let startTime = null;
    if (req.body.days) {
      // If days parameter provided, get jobs from X days ago
      const daysAgo = parseInt(req.body.days) || 7;
      startTime = new Date();
      startTime.setDate(startTime.getDate() - daysAgo);
    } else if (req.body.startDate) {
      // Or use specific start date if provided
      startTime = new Date(req.body.startDate);
    }
    
    // Trigger notifications and get results
    const result = await triggerJobNotifications(startTime);
    
    res.status(200).json({
      success: true,
      message: 'Job notifications triggered',
      result
    });
  } catch (error) {
    console.error('Error triggering job notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering job notifications'
    });
  }
});

module.exports = router; 