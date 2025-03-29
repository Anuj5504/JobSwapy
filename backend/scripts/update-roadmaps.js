const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Roadmap = require('../models/Roadmap');
const { roadmaps } = require('../../frontend/src/data/roadmaps.json');

// Load env variables
dotenv.config();

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully!');
  updateRoadmaps();
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Sample data for the new fields
const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
const samplePrerequisites = {
  'frontend': ['HTML basics', 'CSS fundamentals', 'JavaScript knowledge'],
  'backend': ['Programming basics', 'Command line proficiency', 'Git basics'],
  'fullstack': ['HTML/CSS/JS basics', 'Programming fundamentals', 'Basic networking concepts'],
  'devops': ['Linux basics', 'Networking concepts', 'Programming fundamentals'],
  'android': ['Java/Kotlin basics', 'OOP concepts', 'Computer science fundamentals'],
  'ios': ['Swift basics', 'OOP concepts', 'Computer science fundamentals'],
  'ai-engineer': ['Python programming', 'Math and statistics', 'Basic programming skills'],
  'data-scientist': ['Basic statistics', 'Programming fundamentals', 'Analytical thinking'],
  'cybersecurity': ['Networking basics', 'Operating systems knowledge', 'Basic programming'],
  'blockchain': ['Cryptography basics', 'Networking concepts', 'Basic programming']
};

const sampleAuthors = [
  { name: 'TLE-BlueBit Team', role: 'Core Development Team' },
  { name: 'John Smith', role: 'Senior Developer', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { name: 'Emily Johnson', role: 'Tech Lead', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { name: 'Michael Brown', role: 'Community Contributor', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' }
];

const sampleResources = [
  { title: 'Web Development Bootcamp', url: 'https://example.com/webdev', type: 'course', isPaid: true, description: 'A comprehensive bootcamp covering web development fundamentals.' },
  { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'article', isPaid: false, description: 'The Mozilla Developer Network documentation on web technologies.' },
  { title: 'Introduction to Algorithms', url: 'https://example.com/algorithms', type: 'book', isPaid: true, description: 'A comprehensive introduction to algorithms and data structures.' },
  { title: 'Git & GitHub Crash Course', url: 'https://example.com/git-video', type: 'video', isPaid: false, description: 'A beginner-friendly introduction to version control with Git.' },
  { title: 'VS Code for Developers', url: 'https://example.com/vscode', type: 'tool', isPaid: false, description: 'Learn to use VS Code effectively for development.' }
];

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomResources = () => {
  const resourceCount = getRandomNumber(2, 5);
  const resources = [];
  
  for (let i = 0; i < resourceCount; i++) {
    resources.push({...getRandomItem(sampleResources)});
  }
  
  return resources;
};

const updateRoadmaps = async () => {
  try {
    const roadmapsInDb = await Roadmap.find();
    console.log(`Found ${roadmapsInDb.length} roadmaps in the database.`);
    
    let updatedCount = 0;
    
    for (const roadmap of roadmapsInDb) {
      const estimatedHours = getRandomNumber(20, 120);
      const difficulty = getRandomItem(difficultyLevels);
      const prerequisites = samplePrerequisites[roadmap.id] || 
                           samplePrerequisites['frontend']; // Default to frontend if no specific match
      const author = getRandomItem(sampleAuthors);
      const resources = getRandomResources();
      
      // Update roadmap with new fields
      roadmap.difficulty = difficulty;
      roadmap.estimatedHours = estimatedHours;
      roadmap.prerequisites = prerequisites;
      roadmap.author = author;
      roadmap.resources = resources;
      
      await roadmap.save();
      console.log(`Updated roadmap: ${roadmap.title} (${roadmap.id})`);
      updatedCount++;
    }
    
    console.log(`\n${updatedCount} roadmaps updated successfully with new fields!`);
  } catch (err) {
    console.error('Error updating roadmaps:', err);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB disconnected through app termination.');
    process.exit(0);
  });
}); 