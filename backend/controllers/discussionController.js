const Discussion = require('../models/Discussion');
const Bowl = require('../models/Bowl');
const Comment = require('../models/Comment');

// Get all discussions from a bowl
exports.getDiscussionsByBowl = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const bowlId = req.params.bowlId;
    
    // Check if bowl exists and user has access
    const bowl = await Bowl.findById(bowlId);
    
    if (!bowl) {
      return res.status(404).json({
        success: false,
        message: 'Bowl not found'
      });
    }
    
    // Check if user has access to private bowl
    if (!bowl.isPublic && 
        (!req.userId || 
         (req.userId !== bowl.createdBy.toString() && 
          !bowl.moderators.some(mod => mod.toString() === req.userId)))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to private bowl'
      });
    }
    
    // Sorting options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { likes: -1, createdAt: -1 };
        break;
      case 'pinned':
        sortOptions = { isPinned: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // Pinned discussions always come first regardless of sort
    if (sort !== 'pinned') {
      sortOptions = { isPinned: -1, ...sortOptions };
    }
    
    const discussions = await Discussion.find({ bowlId })
      .populate('userId', 'name username avatar')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Get comment count for each discussion
    const discussionsWithCounts = await Promise.all(
      discussions.map(async (discussion) => {
        const commentCount = await Comment.countDocuments({ 
          discussionId: discussion._id 
        });
        
        const discussionObj = discussion.toObject();
        discussionObj.commentCount = commentCount;
        
        // Check if user has liked or bookmarked
        if (req.userId) {
          discussionObj.isLiked = discussion.likedUsers.some(
            userId => userId.toString() === req.userId
          );
          
          discussionObj.isBookmarked = discussion.bookmarkedBy.some(
            userId => userId.toString() === req.userId
          );
        }
        
        return discussionObj;
      })
    );
    
    const total = await Discussion.countDocuments({ bowlId });
    
    res.status(200).json({
      success: true,
      count: discussions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: discussionsWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving discussions',
      error: error.message
    });
  }
};

// Get single discussion
exports.getDiscussionById = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('userId', 'name username avatar')
      .populate('bowlId', 'title isPublic createdBy moderators');
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Check if bowl is private and user has access
    const bowl = discussion.bowlId;
    if (!bowl.isPublic && 
        (!req.userId || 
         (req.userId !== bowl.createdBy.toString() && 
          !bowl.moderators.some(mod => mod.toString() === req.userId)))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to discussion in private bowl'
      });
    }
    
    // Get comment count
    const commentCount = await Comment.countDocuments({ 
      discussionId: discussion._id 
    });
    
    const discussionObj = discussion.toObject();
    discussionObj.commentCount = commentCount;
    
    // Check if user has liked or bookmarked
    if (req.userId) {
      discussionObj.isLiked = discussion.likedUsers.some(
        userId => userId.toString() === req.userId
      );
      
      discussionObj.isBookmarked = discussion.bookmarkedBy.some(
        userId => userId.toString() === req.userId
      );
    }
    
    res.status(200).json({
      success: true,
      data: discussionObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving discussion',
      error: error.message
    });
  }
};

// Create discussion
exports.createDiscussion = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { title, body, tags, bowlId, attachments, poll } = req.body;
    
    // Validate required fields
    if (!title || !body || !bowlId) {
      return res.status(400).json({
        success: false,
        message: 'Title, body and bowlId are required fields'
      });
    }
    
    // Check if bowl exists and user has access
    const bowl = await Bowl.findById(bowlId);
    
    if (!bowl) {
      return res.status(404).json({
        success: false,
        message: 'Bowl not found'
      });
    }
    
    // Check if user has access to post in private bowl
    if (!bowl.isPublic && 
        (!req.userId || 
         (req.userId !== bowl.createdBy.toString() && 
          !bowl.moderators.some(mod => mod.toString() === req.userId)))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to post in private bowl'
      });
    }
    
    // Process tags with validation
    let processedTags = [];
    if (tags) {
      // Handle case where tags might be an array or a string
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        processedTags = tags.map(tag => 
          typeof tag === 'string' ? tag.trim() : String(tag)
        ).filter(tag => tag);
      }
    }
    
    // Create discussion
    const discussion = await Discussion.create({
      title,
      body,
      tags: processedTags,
      bowlId,
      userId: req.userId,
      attachments: attachments || [],
      poll: poll || null
    });
    
    res.status(201).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    console.error('Discussion creation error:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating discussion',
      error: error.message
    });
  }
};

// Update discussion
exports.updateDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Only creator can update discussion
    if (!req.userId || req.userId !== discussion.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this discussion'
      });
    }
    
    const { title, body, tags, attachments, poll } = req.body;
    
    if (title) discussion.title = title;
    if (body) discussion.body = body;
    if (tags) discussion.tags = tags.split(',').map(tag => tag.trim());
    if (attachments) discussion.attachments = attachments;
    if (poll) discussion.poll = poll;
    
    discussion.updatedAt = Date.now();
    
    const updatedDiscussion = await discussion.save();
    
    res.status(200).json({
      success: true,
      data: updatedDiscussion
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating discussion',
      error: error.message
    });
  }
};

// Delete discussion
exports.deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Get bowl for moderator check
    const bowl = await Bowl.findById(discussion.bowlId);
    
    // Check permissions (creator, admin or bowl moderator)
    if (!req.userId || 
        (req.userId !== discussion.userId.toString() && 
         !bowl.moderators.some(mod => mod.toString() === req.userId))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this discussion'
      });
    }
    
    // Delete all comments for this discussion
    await Comment.deleteMany({ discussionId: discussion._id });
    
    // Delete discussion
    await discussion.remove();
    
    res.status(200).json({
      success: true,
      message: 'Discussion deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting discussion',
      error: error.message
    });
  }
};

// Like/Unlike discussion
exports.toggleLike = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Check if user already liked
    const alreadyLiked = discussion.likedUsers.some(
      userId => userId.toString() === req.userId
    );
    
    if (alreadyLiked) {
      // Unlike
      discussion.likedUsers = discussion.likedUsers.filter(
        userId => userId.toString() !== req.userId
      );
      discussion.likes = Math.max(0, discussion.likes - 1);
    } else {
      // Like
      discussion.likedUsers.push(req.userId);
      discussion.likes += 1;
    }
    
    await discussion.save();
    
    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likes: discussion.likes,
      message: alreadyLiked ? 'Discussion unliked' : 'Discussion liked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// Bookmark/Unbookmark discussion
exports.toggleBookmark = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Check if user already bookmarked
    const alreadyBookmarked = discussion.bookmarkedBy.some(
      userId => userId.toString() === req.userId
    );
    
    if (alreadyBookmarked) {
      // Unbookmark
      discussion.bookmarkedBy = discussion.bookmarkedBy.filter(
        userId => userId.toString() !== req.userId
      );
    } else {
      // Bookmark
      discussion.bookmarkedBy.push(req.userId);
    }
    
    await discussion.save();
    
    res.status(200).json({
      success: true,
      bookmarked: !alreadyBookmarked,
      message: alreadyBookmarked ? 'Discussion unbookmarked' : 'Discussion bookmarked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling bookmark',
      error: error.message
    });
  }
};

// Pin/Unpin discussion (moderator only)
exports.togglePin = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Get bowl for moderator check
    const bowl = await Bowl.findById(discussion.bowlId);
    
    // Check if user is moderator or admin
    if (!bowl.moderators.some(mod => mod.toString() === req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pin/unpin discussions'
      });
    }
    
    // Toggle pin status
    discussion.isPinned = !discussion.isPinned;
    
    await discussion.save();
    
    res.status(200).json({
      success: true,
      isPinned: discussion.isPinned,
      message: discussion.isPinned ? 'Discussion pinned' : 'Discussion unpinned'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling pin status',
      error: error.message
    });
  }
};

// Vote in poll
exports.votePoll = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { optionIndex } = req.body;
    
    if (optionIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Option index is required'
      });
    }
    
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Check if discussion has a poll
    if (!discussion.poll) {
      return res.status(400).json({
        success: false,
        message: 'This discussion does not have a poll'
      });
    }
    
    // Check if poll is active
    if (!discussion.poll.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This poll is no longer active'
      });
    }
    
    // Check if option exists
    if (optionIndex < 0 || optionIndex >= discussion.poll.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option index'
      });
    }
    
    // Check if user already voted in this poll
    const userVoted = discussion.poll.options.some(option => 
      option.votedUsers.some(userId => userId.toString() === req.userId)
    );
    
    if (userVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }
    
    // Record vote
    discussion.poll.options[optionIndex].votes += 1;
    discussion.poll.options[optionIndex].votedUsers.push(req.userId);
    
    await discussion.save();
    
    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: discussion.poll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error voting in poll',
      error: error.message
    });
  }
}; 