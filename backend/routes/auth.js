const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Regular authentication routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Google authentication routes
router.post('/google-signup', authController.googleSignup);
router.post('/google-login', authController.googleLogin);

// Registration check route
router.get('/check-registration', authenticateToken, authController.checkRegistration);

// Resume upload route
router.post(
  '/upload-resume',
  authenticateToken,
  authController.uploadMiddleware,
  authController.uploadResume
);

router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.get('/getRecommendation/:id', authenticateToken, authController.getRecommendation);

module.exports = router;