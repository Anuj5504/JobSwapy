const Job = require('../models/Job');
const User = require('../models/User');

// Get jobs with pagination


exports.getJobs = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get jobs with pagination
    const jobs = await Job.find()
      // .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalJobs = await Job.countDocuments();
    const totalPages = Math.ceil(totalJobs / limit);

    res.status(200).json({
      success: true,
      count: jobs.length,
      pagination: {
        total: totalJobs,
        pages: totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
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

      // Update user's AppliedJobs array to match the model definition
      await User.findByIdAndUpdate(userId, {
        $addToSet: { AppliedJobs: jobId }
      });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { AppliedJobs: jobId }
    });

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

