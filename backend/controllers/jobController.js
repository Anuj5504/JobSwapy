const Job = require('../models/Job');
const User = require('../models/User');

// Get jobs with pagination


exports.getJobs = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Handle search query (title, company, description)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { description: searchRegex }
      ];
    }

    // Handle location filter
    if (req.query.location) {
      filter['jobDetails.location'] = new RegExp(req.query.location, 'i');
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
          filter.$or = filter.$or || [];
          // Combine with existing OR conditions
          filter.$or.push(...workTypeConditions);
        }
      }
    }

    // Handle source filter (linkedin, indeed, glassdoor, naukri, internshala)
    if (req.query.source) {
      const sources = req.query.source.split(',').filter(Boolean);
      if (sources.length > 0) {
        filter.source = { $in: sources.map(source => new RegExp(source, 'i')) };
      }
    }

    // Handle skills filter
    if (req.query.skills) {
      filter.skills = { $in: req.query.skills.split(',').map(skill => new RegExp(skill.trim(), 'i')) };
    }

    // Get jobs with pagination and filters
    let jobs = await Job.find(filter)
      .sort({ 'jobDetails.postedDate': -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    // Handle skill match percentage filter if provided
    let totalJobs = await Job.countDocuments(filter);
    
    // Check if we need to calculate skill match percentages
    const hasSkillMatchFilter = req.query.skillMatchPercentage || (req.query.skillMatchMin && req.query.skillMatchMax);
    
    if (hasSkillMatchFilter) {
      // Find the user to get their skills
      const User = require('../models/User');
      const userId = req.query.userId; // This should be passed from frontend
      
      try {
        const user = await User.findById(userId);
        
        if (user && user.skills && user.skills.length > 0) {
          // Calculate match percentage for each job
          jobs = jobs.map(job => {
            const jobSkills = job.skills || [];
            
            // Find exact matches between user skills and job skills
            const matchedSkills = user.skills.filter(skill => 
              jobSkills.some(jobSkill => jobSkill.toLowerCase() === skill.toLowerCase())
            );
            
            // Calculate percentage based on job's required skills
            const matchPercentage = jobSkills.length > 0 
              ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
              : 0;
            
            // Add match percentage to job object
            return {
              ...job.toObject(),
              skillMatchPercentage: matchPercentage
            };
          });
          
          // Filter jobs based on skill match criteria
          let filteredJobs = jobs;
          
          if (req.query.skillMatchPercentage) {
            // Filter by minimum percentage (legacy support)
            const minPercentage = parseInt(req.query.skillMatchPercentage);
            filteredJobs = jobs.filter(job => job.skillMatchPercentage >= minPercentage);
          } else if (req.query.skillMatchMin && req.query.skillMatchMax) {
            // Filter by range
            const minMatch = parseInt(req.query.skillMatchMin);
            const maxMatch = parseInt(req.query.skillMatchMax);
            filteredJobs = jobs.filter(job => 
              job.skillMatchPercentage >= minMatch && job.skillMatchPercentage <= maxMatch
            );
          }
          
          // Update returned jobs and count
          jobs = filteredJobs;
          totalJobs = filteredJobs.length;
        }
      } catch (error) {
        console.error('Error calculating skill match:', error);
        // Continue with unfiltered jobs if there's an error
      }
    }

    // Calculate total pages based on potentially filtered results
    const totalPages = Math.ceil(totalJobs / limit);

    res.status(200).json({
      success: true,
      count: jobs.length,
      pagination: {
        total: totalJobs,
        pages: totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        totalDocs: totalJobs
      },
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs'
    });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // If user is authenticated, increment view count and add to viewedBy array
    if (req.userId) {
      const userId = req.userId;
      
      // Check if user hasn't already viewed this job
      if (!job.viewedBy.includes(userId)) {
        // Update job: add user to viewedBy array and increment viewCount
        await Job.findByIdAndUpdate(req.params.id, {
          $addToSet: { viewedBy: userId },
          $inc: { viewCount: 1 }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Job not found - invalid ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job details'
    });
  }
}; 

// Get similar jobs
exports.getSimilarJobs = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Find similar jobs based on skills or title, excluding the current job
    const similarJobs = await Job.find({
      _id: { $ne: job._id }, // Exclude the current job
      $or: [
        { skills: { $in: job.skills } }, // Jobs with matching skills
        { title: { $regex: job.title.split(' ').slice(0, 2).join('|'), $options: 'i' } } // Jobs with similar titles
      ]
    })
    .limit(4) // Return only 4 similar jobs
    .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      count: similarJobs.length,
      data: similarJobs
    });
  } catch (error) {
    console.error('Error fetching similar jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching similar jobs'
    });
  }
}; 

// Record a job application
const recordJobApplication = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has already applied to this job
    if (!job.appliedBy.includes(userId)) {
      // Add user to appliedBy array and increment appliedCount
      await Job.findByIdAndUpdate(jobId, {
        $addToSet: { appliedBy: userId },
        $inc: { appliedCount: 1 }
      });

      // Also update user's applied jobs if you have that field in user model
      await User.findByIdAndUpdate(userId, {
        $addToSet: { appliedJobs: jobId }
      });
    }

    return res.status(200).json({ message: 'Job application recorded successfully' });
  } catch (error) {
    console.error('Error recording job application:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get job interaction stats
const getJobStats = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId).select('viewCount appliedCount savedCount');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.status(200).json({ 
      viewCount: job.viewCount,
      appliedCount: job.appliedCount,
      savedCount: job.savedCount
    });
  } catch (error) {
    console.error('Error getting job stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Check if user has interacted with a job
const checkUserJobInteraction = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const hasViewed = job.viewedBy.includes(userId);
    const hasApplied = job.appliedBy.includes(userId);
    const hasSaved = job.savedBy.includes(userId);

    return res.status(200).json({
      hasViewed,
      hasApplied,
      hasSaved
    });
  } catch (error) {
    console.error('Error checking user job interaction:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getJobs: exports.getJobs,
  getJobById: exports.getJobById,
  getSimilarJobs: exports.getSimilarJobs,
  recordJobApplication,
  getJobStats,
  checkUserJobInteraction
}; 

