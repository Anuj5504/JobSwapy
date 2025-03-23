const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Job = require('../models/Job');
const mongoose = require('mongoose');

// Public routes
router.get('/', authenticateToken,jobController.getJobs);
router.get('/:id', authenticateToken,jobController.getJobById);


router.get('/getRecommendation/:id', async (req, res) => {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const user = await User.findById(req.params.id);
      console.log(user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Query with pagination
      const recommendations = await Job.find({
        $or: [
          { skills: { $in: user.skills } },
          { $or: user.skills.map(skill => ({ title: { $regex: skill, $options: "i" } })) }
        ]
      })
      .skip(skip)
      .limit(limit);
      
      // Get total count for pagination
      const totalRecommendations = await Job.countDocuments({
        $or: [
          { skills: { $in: user.skills } },
          { $or: user.skills.map(skill => ({ title: { $regex: skill, $options: "i" } })) }
        ]
      });
      
      const totalPages = Math.ceil(totalRecommendations / limit);

      res.status(200).json({
        success: true,
        count: recommendations.length,
        pagination: {
          total: totalRecommendations,
          pages: totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        data: recommendations
      });
  
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ 
        success: false,
        message: "Server error while fetching recommendations" 
      });
    }
  })


router.post('/savejob/:jobid', async (req, res) => {
    try {
        const jobId=req.params.jobid;
      const user = await User.findById(req.params.id);
           
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const job=await Job.findById(jobId);
  
      if(!job){
        return res.status(404).json({message:"Invalid id"});
      }
  
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { savedJobs: jobId } },
        { new: true }
      );
      
      res.status(200).json({
        updatedUser
      });
  
    } catch (error) {
      res.status(500).json({ message: "Failed fetching data" });
    }
  })


// Protected routes (if any)
// router.post('/', authenticateToken, jobController.createJob);
// router.put('/:id', authenticateToken, jobController.updateJob);
// router.delete('/:id', authenticateToken, jobController.deleteJob);

module.exports = router; 