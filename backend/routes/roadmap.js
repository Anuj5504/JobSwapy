const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const Roadmap = require('../models/Roadmap');

// Get all roadmaps
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all roadmaps');
    const roadmaps = await Roadmap.find({});
    console.log(`Found ${roadmaps.length} roadmaps`);
    
    res.status(200).json({
      success: true,
      count: roadmaps.length,
      data: roadmaps.map(r => ({ id: r.id, title: r.title }))
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching roadmaps'
    });
  }
});

// Debugging route to check all available roadmaps
router.get('/debug/all', async (req, res) => {
  try {
    console.log('Debugging - fetching all roadmaps');
    const roadmaps = await Roadmap.find({}).select('id title slug');
    
    console.log('Available roadmaps:', roadmaps.map(r => r.id));
    
    res.status(200).json({
      success: true,
      count: roadmaps.length,
      data: roadmaps
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in debug route',
      error: error.message
    });
  }
});

// Get roadmap by ID - USING STRING ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Request received for roadmap with ID: ${req.params.id}`);
    
    // Find by string ID field, not MongoDB _id
    const roadmap = await Roadmap.findOne({ id: req.params.id });
    
    console.log(`Roadmap found: ${Boolean(roadmap)}`);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: `Roadmap with ID ${req.params.id} not found`
      });
    }
    
    // Process nodes to ensure hierarchy data is structured properly
    const processedRoadmap = { ...roadmap.toObject() };
    
    // Make sure all nodes have parent and level properties
    if (processedRoadmap.nodes) {
      processedRoadmap.nodes = processedRoadmap.nodes.map(node => {
        if (!node.data) node.data = {};
        if (node.data.parent === undefined) node.data.parent = '';
        if (node.data.level === undefined) node.data.level = 0;
        return node;
      });
    }
    
    console.log(`Sending roadmap: ${roadmap.title}`);
    return res.status(200).json(processedRoadmap);
  } catch (error) {
    console.error(`Error fetching roadmap with ID ${req.params.id}:`, error);
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching roadmap details',
      error: error.message
    });
  }
});

// Create a new roadmap
router.post('/', async (req, res) => {
  try {
    console.log('Creating new custom roadmap');
    
    // Ensure slug is set
    if (!req.body.slug && req.body.id) {
      req.body.slug = req.body.id;
    }
    
    // Check if roadmap with the same ID already exists
    const existingRoadmap = await Roadmap.findOne({ id: req.body.id });
    if (existingRoadmap) {
      console.log(`Roadmap with ID ${req.body.id} already exists`);
      // Append random number to make ID unique
      req.body.id = `${req.body.id}-${Math.floor(Math.random() * 1000)}`;
      req.body.slug = req.body.id;
    }
    
    console.log(`Creating roadmap with ID: ${req.body.id}`);
    
    // Create the roadmap
    const roadmap = new Roadmap({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await roadmap.save();
    console.log(`Created new roadmap: ${roadmap.title} (${roadmap.id})`);
    
    return res.status(201).json(roadmap);
  } catch (err) {
    console.error('Error creating roadmap:', err.message);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
});

// Update roadmap by ID (protected route)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin role (optional)
    // const user = await User.findById(req.userId);
    // if (!user || !user.isAdmin) {
    //   return res.status(403).json({ success: false, message: 'Not authorized' });
    // }
    
    const updatedRoadmap = await Roadmap.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedRoadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedRoadmap
    });
  } catch (error) {
    console.error('Error updating roadmap:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating roadmap'
    });
  }
});

// Delete roadmap by ID (protected route)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin role (optional)
    // const user = await User.findById(req.userId);
    // if (!user || !user.isAdmin) {
    //   return res.status(403).json({ success: false, message: 'Not authorized' });
    // }
    
    const deletedRoadmap = await Roadmap.findByIdAndDelete(req.params.id);
    
    if (!deletedRoadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting roadmap'
    });
  }
});

module.exports = router;