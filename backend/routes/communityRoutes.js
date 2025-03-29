const express = require('express');
const router = express.Router();
const bowlController = require('../controllers/bowlController');
const discussionController = require('../controllers/discussionController');
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Bowl routes
router.get('/bowls', authenticateToken, bowlController.getAllBowls);
router.get('/bowls/:id', authenticateToken, bowlController.getBowlById);
router.post('/bowls', authenticateToken, bowlController.createBowl);
router.put('/bowls/:id', authenticateToken, bowlController.updateBowl);
router.delete('/bowls/:id', authenticateToken, bowlController.deleteBowl);
router.post('/bowls/:id/moderator', authenticateToken, bowlController.manageModerator);

// Discussion routes
router.get('/bowls/:bowlId/discussions', authenticateToken, discussionController.getDiscussionsByBowl);
router.get('/discussions/:id', authenticateToken, discussionController.getDiscussionById);
router.post('/discussions', authenticateToken, discussionController.createDiscussion);
router.put('/discussions/:id', authenticateToken, discussionController.updateDiscussion);
router.delete('/discussions/:id', authenticateToken, discussionController.deleteDiscussion);
router.post('/discussions/:id/like', authenticateToken, discussionController.toggleLike);
router.post('/discussions/:id/bookmark', authenticateToken, discussionController.toggleBookmark);
router.post('/discussions/:id/pin', authenticateToken, discussionController.togglePin);
router.post('/discussions/:id/vote', authenticateToken, discussionController.votePoll);

// Comment routes
router.get('/discussions/:discussionId/comments', authenticateToken, commentController.getCommentsByDiscussion);
router.get('/comments/:id', authenticateToken, commentController.getCommentById);
router.post('/comments', authenticateToken, commentController.createComment);
router.put('/comments/:id', authenticateToken, commentController.updateComment);
router.delete('/comments/:id', authenticateToken, commentController.deleteComment);
router.post('/comments/:id/like', authenticateToken, commentController.toggleLike);

module.exports = router; 