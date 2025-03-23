const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get user profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's saved jobs
router.get('/:id/savedJobs', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('savedJobs');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ savedJobs: user.savedJobs });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ message: 'Error fetching saved jobs' });
  }
});


// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 