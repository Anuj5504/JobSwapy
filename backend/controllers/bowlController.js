const Bowl = require('../models/Bowl');
const Discussion = require('../models/Discussion');

// Get all bowls with optional filtering
exports.getAllBowls = async (req, res) => {
  try {
    const { tags, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Handle search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Handle tags filtering
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Only return public bowls + user's private bowls
    const userBowlsQuery = req.userId ? 
      { $or: [{ isPublic: true }, { createdBy: req.userId }, { moderators: req.userId }] } : 
      { isPublic: true };
    
    query = { ...query, ...userBowlsQuery };
    
    const bowls = await Bowl.find(query)
      .populate('createdBy', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Bowl.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bowls.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bowls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving bowls',
      error: error.message
    });
  }
};

// Get single bowl by ID
exports.getBowlById = async (req, res) => {
  try {
    const bowl = await Bowl.findById(req.params.id)
      .populate('createdBy', 'name username avatar')
      .populate('moderators', 'name username avatar');
    
    if (!bowl) {
      return res.status(404).json({
        success: false,
        message: 'Bowl not found'
      });
    }
    
    // Check if bowl is private and user has access
    if (!bowl.isPublic && 
        (!req.userId || 
         (req.userId !== bowl.createdBy._id.toString() && 
          !bowl.moderators.some(mod => mod._id.toString() === req.userId)))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to private bowl'
      });
    }
    
    res.status(200).json({
      success: true,
      data: bowl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving bowl',
      error: error.message
    });
  }
};

// Create new bowl
exports.createBowl = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { title, description, tags, isPublic, rules } = req.body;
    
    const bowl = await Bowl.create({
      title,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic: isPublic !== undefined ? isPublic : true,
      rules,
      createdBy: req.userId,
      moderators: [req.userId] // Creator is automatically a moderator
    });
    
    res.status(201).json({
      success: true,
      data: bowl
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating bowl',
      error: error.message
    });
  }
};

// Update bowl
exports.updateBowl = async (req, res) => {
  try {
    const bowl = await Bowl.findById(req.params.id);
    
    if (!bowl) {
      return res.status(404).json({
        success: false,
        message: 'Bowl not found'
      });
    }
    
    // Check if user is authorized (creator or moderator)
    if (!req.userId || 
        (req.userId !== bowl.createdBy.toString() && 
         !bowl.moderators.includes(req.userId))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bowl'
      });
    }
    
    const { title, description, tags, isPublic, rules, moderators } = req.body;
    
    // Only creator can change these fields
    if (req.userId === bowl.createdBy.toString()) {
      if (title) bowl.title = title;
      if (description) bowl.description = description;
      if (isPublic !== undefined) bowl.isPublic = isPublic;
      if (moderators) bowl.moderators = moderators;
    }
    
    // Both creator and moderators can update these
    if (tags) bowl.tags = tags.split(',').map(tag => tag.trim());
    if (rules) bowl.rules = rules;
    
    const updatedBowl = await bowl.save();
    
    res.status(200).json({
      success: true,
      data: updatedBowl
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating bowl',
      error: error.message
    });
  }
};

// Delete bowl
exports.deleteBowl = async (req, res) => {
  try {
    const bowl = await Bowl.findById(req.params.id);
    
    if (!bowl) {
      return res.status(404).json({
        success: false,
        message: 'Bowl not found'
      });
    }
    
    // Only creator or admin can delete bowl
    if (!req.userId || 
        (req.userId !== bowl.createdBy.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this bowl'
      });
    }
    
    // Delete all discussions in this bowl
    await Discussion.deleteMany({ bowlId: bowl._id });
    
    // Delete the bowl
    await bowl.remove();
    
    res.status(200).json({
      success: true,
      message: 'Bowl deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting bowl',
      error: error.message
    });
  }
};

// Add/remove moderator
exports.manageModerator = async (req, res) => {
  try {
    const { userId, action } = req.body;
    
    if (!userId || !['add', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Provide userId and action (add/remove)'
      });
    }
    
    const bowl = await Bowl.findById(req.params.id);
    
    if (!bowl) {
      return res.status(404).json({
        success: false,
        message: 'Bowl not found'
      });
    }
    
    // Only creator can manage moderators
    if (!req.userId || req.userId !== bowl.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can manage moderators'
      });
    }
    
    if (action === 'add') {
      // Check if user is already a moderator
      if (bowl.moderators.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User is already a moderator'
        });
      }
      
      bowl.moderators.push(userId);
    } else {
      // Remove moderator
      bowl.moderators = bowl.moderators.filter(
        mod => mod.toString() !== userId.toString()
      );
    }
    
    await bowl.save();
    
    res.status(200).json({
      success: true,
      message: `Moderator ${action === 'add' ? 'added' : 'removed'} successfully`,
      data: bowl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error managing moderator',
      error: error.message
    });
  }
}; 