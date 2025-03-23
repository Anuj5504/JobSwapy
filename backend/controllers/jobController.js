const Job = require('../models/Job');

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


// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    
    // Check if error is due to invalid ObjectId
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

