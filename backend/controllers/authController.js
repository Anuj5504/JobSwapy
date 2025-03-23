const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

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

// Configure multer upload
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Controller methods
exports.signup = async (req, res) => {
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
      authType: 'email',
      registrationComplete: false
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
};

exports.login = async (req, res) => {
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
        authType: 'email',
        registrationComplete: false
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
          email: newUser.email,
          registrationComplete: newUser.registrationComplete
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
};

exports.googleSignup = async (req, res) => {
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
        authType: 'google',
        registrationComplete: false
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
};

exports.googleLogin = async (req, res) => {
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
        authType: 'google',
        registrationComplete: false
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
};

exports.checkRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ registrationComplete: user.registrationComplete });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadResume = async (req, res) => {
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
      'sales', 'customer service', 'leadership', 'communication',
      'typescript', 'graphql', 'express', 'django', 'flask', 'spring boot',
      'angular', 'vue', 'svelte', 'next.js', 'nuxt.js', 'tailwind css',
      'bootstrap', 'sass', 'less', 'webpack', 'babel', 'redis', 'postgresql',
      'oracle', 'sqlite', 'elasticsearch', 'cassandra', 'big data',
      'hadoop', 'spark', 'data science', 'machine learning', 'deep learning',
      'tensorflow', 'pytorch', 'nlp', 'computer vision', 'cybersecurity',
      'ethical hacking', 'penetration testing', 'blockchain', 'smart contracts',
      'solidity', 'web3', 'rest api', 'graphql api', 'microservices',
      'cloud computing', 'ci/cd', 'terraform', 'ansible', 'puppet', 'chef',
      'networking', 'linux', 'bash scripting', 'powershell', 'gitlab',
      'jira', 'confluence', 'trello', 'figma', 'adobe xd', 'ui/ux design',
      'wireframing', 'prototyping', 'a/b testing', 'copywriting',
      'email marketing', 'ppc advertising', 'facebook ads', 'google ads',
      'crm', 'erp', 'sap', 'business analysis', 'financial modeling',
      'risk management', 'time management', 'negotiation', 'public speaking',
      'emotional intelligence', 'team collaboration', 'conflict resolution',
      'event planning', 'supply chain management', 'e-commerce', 'dropshipping',
      'affiliate marketing', 'wordpress', 'shopify', 'wix', 'video editing',
      'animation', '3d modeling', 'game development', 'unity', 'unreal engine'
    ];
    
    
    const skills = commonSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill)
    );
    
    // Basic interests extraction
    const commonInterests = [
        'software architecture', 'system design', 'api development', 'backend development', 
        'frontend development', 'full-stack development', 'progressive web apps', 
        'serverless computing', 'microservices architecture', 'database administration', 
        'big data analytics', 'data engineering', 'data visualization', 'natural language processing', 
        'reinforcement learning', 'predictive analytics', 'quantum computing', 'bioinformatics', 
        'edge computing', 'computer networking', 'ethical hacking', 'penetration testing', 
        'digital forensics', 'security operations', 'risk assessment', 'network security', 
        'cryptography', 'identity and access management', 'cloud security', 'zero trust architecture', 
        'smart contract development', 'decentralized finance (DeFi)', 'tokenomics', 
        'nft development', 'metaverse development', 'ar/vr development', 'game programming', 
        'computer graphics', '3d rendering', 'motion graphics', 'vfx', 'video production', 
        'animation', 'storyboarding', 'brand identity design', 'typography', 'illustration', 
        'industrial design', 'automotive design', 'fashion design', 'interior design', 
        'architecture', 'urban planning', 'mechanical engineering', 'electrical engineering', 
        'civil engineering', 'robotics', 'embedded systems', 'hardware design', 
        'internet security', 'automation testing', 'performance testing', 'unit testing', 
        'test-driven development', 'behavior-driven development', 'release management', 
        'configuration management', 'version control', 'continuous integration', 
        'continuous deployment', 'agile methodologies', 'scrum master', 'kanban', 
        'lean startup', 'product management', 'business intelligence', 'market research', 
        'growth hacking', 'public relations', 'advertising', 'event management', 
        'customer relationship management', 'lead generation', 'account management', 
        'strategic planning', 'investment analysis', 'portfolio management', 
        'corporate finance', 'supply chain optimization', 'logistics management', 
        'procurement', 'e-commerce strategy', 'dropshipping', 'affiliate marketing', 
        'youtube content creation', 'podcasting', 'social media strategy', 'influencer marketing', 
        'copywriting', 'screenwriting', 'creative writing', 'journalism', 'editing', 
        'translation', 'language teaching', 'psychology', 'sociology', 'philosophy', 
        'history', 'political science', 'law', 'human rights', 'sports science', 
        'nutrition', 'dietary planning', 'personal training', 'physiotherapy', 
        'mental health counseling', 'public health', 'epidemiology', 'biotechnology'
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
};

exports.uploadMiddleware = upload.single('resume');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        skills: user.skills || [],
        interests: user.interests || [],
        registrationComplete: user.registrationComplete
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching profile' 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, photoURL, skills, interests } = req.body;
    
    const updateData = {
      ...(name !== undefined && { name }),
      ...(photoURL !== undefined && { photoURL })
    };
    
    // Always set skills and interests arrays, whether empty or not
    updateData.skills = Array.isArray(skills) ? skills : [];
    updateData.interests = Array.isArray(interests) ? interests : [];
        
    // Find user and update
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    );
        
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL,
        skills: updatedUser.skills || [],
        interests: updatedUser.interests || [],
        registrationComplete: updatedUser.registrationComplete
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating profile' 
    });
  }
};

exports.getRecommendation = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    const Job = require('../models/Job');
    
    const recommendations = await Job.find({
      $or: [
        { skills: { $in: user.skills } },
        { $or: user.skills.map(skill => ({ title: { $regex: skill, $options: "i" } })) }
      ]
    });

    res.status(200).json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed fetching recommendations" 
    });
  }
};

