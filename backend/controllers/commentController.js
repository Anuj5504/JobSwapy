const Comment = require('../models/Comment');
const Discussion = require('../models/Discussion');
const Bowl = require('../models/Bowl');

// Get comments for a discussion
exports.getCommentsByDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    
    // Check if discussion exists and user has access
    const discussion = await Discussion.findById(discussionId)
      .populate('bowlId', 'isPublic createdBy moderators');
    
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
        message: 'Access denied to comments in private bowl'
      });
    }
    
    // Fetch top-level comments (those without parent)
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
      default:
        sortOptions = { createdAt: -1 };
    }
    
    const comments = await Comment.find({ 
      discussionId, 
      parentId: null 
    })
      .populate('userId', 'name username avatar')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // For each top-level comment, fetch replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        // Get replies to this comment
        const replies = await Comment.find({ 
          discussionId, 
          parentId: comment._id 
        })
          .populate('userId', 'name username avatar')
          .sort({ createdAt: 1 }); // Always sort replies chronologically
        
        // Add like status for user if authenticated
        const commentObj = comment.toObject();
        if (req.userId) {
          commentObj.isLiked = comment.likedUsers.some(
            userId => userId.toString() === req.userId
          );
        }
        
        // Add replies with like status
        commentObj.replies = replies.map(reply => {
          const replyObj = reply.toObject();
          if (req.userId) {
            replyObj.isLiked = reply.likedUsers.some(
              userId => userId.toString() === req.userId
            );
          }
          return replyObj;
        });
        
        return commentObj;
      })
    );
    
    // Count total top-level comments
    const total = await Comment.countDocuments({ 
      discussionId, 
      parentId: null 
    });
    
    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: commentsWithReplies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving comments',
      error: error.message
    });
  }
};

// Get a single comment with replies
exports.getCommentById = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('userId', 'name username avatar')
      .populate({
        path: 'discussionId',
        select: 'title bowlId',
        populate: {
          path: 'bowlId',
          select: 'title isPublic createdBy moderators'
        }
      });
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if bowl is private and user has access
    const bowl = comment.discussionId.bowlId;
    if (!bowl.isPublic && 
        (!req.userId || 
         (req.userId !== bowl.createdBy.toString() && 
          !bowl.moderators.some(mod => mod.toString() === req.userId)))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to comment in private bowl'
      });
    }
    
    // Get replies if it's a top-level comment
    let commentObj = comment.toObject();
    
    if (!comment.parentId) {
      const replies = await Comment.find({ 
        discussionId: comment.discussionId, 
        parentId: comment._id 
      })
        .populate('userId', 'name username avatar')
        .sort({ createdAt: 1 });
      
      // Add like status for replies
      commentObj.replies = replies.map(reply => {
        const replyObj = reply.toObject();
        if (req.userId) {
          replyObj.isLiked = reply.likedUsers.some(
            userId => userId.toString() === req.userId
          );
        }
        return replyObj;
      });
    }
    
    // Add like status for the comment
    if (req.userId) {
      commentObj.isLiked = comment.likedUsers.some(
        userId => userId.toString() === req.userId
      );
    }
    
    res.status(200).json({
      success: true,
      data: commentObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving comment',
      error: error.message
    });
  }
};

// Create a comment
exports.createComment = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { discussionId, parentId, text } = req.body;
    
    if (!discussionId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Discussion ID and text are required'
      });
    }
    
    // Check if discussion exists and user has access
    const discussion = await Discussion.findById(discussionId)
      .populate('bowlId', 'isPublic createdBy moderators');
    
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
        message: 'Access denied to comment in private bowl'
      });
    }
    
    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
      
      // Ensure parent comment belongs to the same discussion
      if (parentComment.discussionId.toString() !== discussionId) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to this discussion'
        });
      }
      
      // Only allow one level of nesting (reply to top-level comment)
      if (parentComment.parentId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reply to a reply, only to top-level comments'
        });
      }
    }
    
    // Create the comment
    const comment = await Comment.create({
      discussionId,
      parentId: parentId || null,
      userId: req.userId,
      text
    });
    
    // Populate user data
    await comment.populate('userId', 'name username avatar');
    
    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Only creator can update comment
    if (!req.userId || req.userId !== comment.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }
    
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    comment.text = text;
    comment.updatedAt = Date.now();
    
    const updatedComment = await comment.save();
    await updatedComment.populate('userId', 'name username avatar');
    
    res.status(200).json({
      success: true,
      data: updatedComment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Get discussion and bowl for moderator check
    const discussion = await Discussion.findById(comment.discussionId)
      .populate('bowlId', 'moderators');
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    // Check permissions (creator, admin or bowl moderator)
    if (!req.userId || 
        (req.userId !== comment.userId.toString() && 
         !discussion.bowlId.moderators.some(mod => mod.toString() === req.userId))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
    
    // If it's a top-level comment, delete all its replies
    if (!comment.parentId) {
      await Comment.deleteMany({ 
        discussionId: comment.discussionId, 
        parentId: comment._id 
      });
    }
    
    // Delete the comment
    await comment.remove();
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

// Like/Unlike a comment
exports.toggleLike = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user already liked
    const alreadyLiked = comment.likedUsers.some(
      userId => userId.toString() === req.userId
    );
    
    if (alreadyLiked) {
      // Unlike
      comment.likedUsers = comment.likedUsers.filter(
        userId => userId.toString() !== req.userId
      );
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      // Like
      comment.likedUsers.push(req.userId);
      comment.likes += 1;
    }
    
    await comment.save();
    
    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likes: comment.likes,
      message: alreadyLiked ? 'Comment unliked' : 'Comment liked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
}; 