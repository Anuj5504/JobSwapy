const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.get('/', authenticateToken,jobController.getJobs);
router.get('/:id', authenticateToken,jobController.getJobById);

// Protected routes (if any)
// router.post('/', authenticateToken, jobController.createJob);
// router.put('/:id', authenticateToken, jobController.updateJob);
// router.delete('/:id', authenticateToken, jobController.deleteJob);

module.exports = router; 