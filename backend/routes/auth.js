const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Regular signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, firebaseUid } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      firebaseUid,
      authType: 'email'
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL,
        authType: newUser.authType,
        registrationComplete: newUser.registrationComplete
      }
    });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Regular login
router.post('/login', async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;

    // Find user
    const user = await User.findOne({ email });
    
    // If user doesn't exist, create a new one (this handles the case where a user might have
    // authenticated with Firebase but doesn't have a record in MongoDB yet)
    if (!user) {
      const newUser = new User({
        email,
        firebaseUid,
        authType: 'email'
      });

      await newUser.save();
      
      // Generate JWT
      const token = jwt.sign(
        { userId: newUser._id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: newUser._id,
          email: newUser.email
        }
      });
    }

    // Update Firebase UID if it's changed
    if (user.firebaseUid !== firebaseUid) {
      user.firebaseUid = firebaseUid;
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        authType: user.authType,
        registrationComplete: user.registrationComplete
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google signup
router.post('/google-signup', async (req, res) => {
  try {
    const { name, email, photoURL, firebaseUid } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists but was not created with Google, update their record
      if (user.authType !== 'google') {
        user.authType = 'google';
        user.firebaseUid = firebaseUid;
        user.photoURL = photoURL || user.photoURL;
        user.name = name || user.name;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email,
        photoURL,
        firebaseUid,
        authType: 'google'
      });

      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        authType: user.authType,
        registrationComplete: user.registrationComplete
      }
    });
  } catch (error) {
    console.error('Error in Google signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google login
router.post('/google-login', async (req, res) => {
  try {
    const { email, name, photoURL, firebaseUid } = req.body;

    // Find user by email
    let user = await User.findOne({ email });

    // If user doesn't exist, create a new one
    if (!user) {
      user = new User({
        name,
        email,
        photoURL,
        firebaseUid,
        authType: 'google'
      });

      await user.save();
    } else {
      // Update user information
      user.name = name || user.name;
      user.photoURL = photoURL || user.photoURL;
      user.firebaseUid = firebaseUid;
      if (user.authType !== 'google') {
        user.authType = 'google';
      }
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        authType: user.authType,
        registrationComplete: user.registrationComplete
      }
    });
  } catch (error) {
    console.error('Error in Google login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set up multer storage for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/resumes';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename using user ID and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow PDF and Word documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Route to check if registration is complete
router.get('/check-registration', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ registrationComplete: user.registrationComplete });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resume upload route
router.post(
  '/upload-resume',
  authenticateToken,
  upload.single('resume'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Extract text from resume based on file type
      let resumeText = '';
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      if (fileExt === '.pdf') {
        // Extract text from PDF
        const pdfData = await fs.promises.readFile(filePath);
        const pdfContent = await pdfParse(pdfData);
        resumeText = pdfContent.text;
      } else if (fileExt === '.doc' || fileExt === '.docx') {
        // Extract text from Word document
        const result = await mammoth.extractRawText({ path: filePath });
        resumeText = result.value;
      }
      
      // Basic skill extraction (this could be enhanced with AI/ML)
      const commonSkills = [
        'javascript', 'react', 'node', 'python', 'java', 'c++', 'html', 'css',
        'sql', 'mongodb', 'firebase', 'aws', 'azure', 'devops', 'docker',
        'kubernetes', 'git', 'agile', 'scrum', 'project management',
        'marketing', 'seo', 'social media', 'content writing', 'analytics',
        'sales', 'customer service', 'leadership', 'communication'
      ];
      
      const skills = commonSkills.filter(skill => 
        resumeText.toLowerCase().includes(skill)
      );
      
      // Basic interests extraction
      const commonInterests = [
        'web development', 'mobile development', 'data science', 'machine learning',
        'artificial intelligence', 'cloud computing', 'cybersecurity', 'blockchain',
        'iot', 'ui/ux', 'graphic design', 'digital marketing', 'content creation',
        'business analysis', 'finance', 'healthcare', 'education', 'environment'
      ];
      
      const interests = commonInterests.filter(interest => 
        resumeText.toLowerCase().includes(interest)
      );
      
      // Update user with resume info and extracted data
      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          resume: {
            url: filePath,
            filename: req.file.filename,
            uploadedAt: new Date()
          },
          skills,
          interests,
          registrationComplete: true
        },
        { new: true }
      );
      
      res.json({
        message: 'Resume uploaded successfully',
        skills,
        interests,
        registrationComplete: true
      });
    } catch (error) {
      console.error('Resume upload error:', error);
      res.status(500).json({ message: 'Error processing resume' });
    }
  }
);

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    req.userId = decoded.userId;
    next();
  });
}

module.exports = router; 