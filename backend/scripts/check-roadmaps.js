require('dotenv').config();
const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap');

const checkRoadmaps = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MongoDB URI not found in environment variables");
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully!');

    // Count roadmaps
    const count = await Roadmap.countDocuments();
    console.log(`Total roadmaps in database: ${count}`);

    // Get all roadmaps
    const roadmaps = await Roadmap.find({});
    console.log('\nRoadmap IDs in database:');
    roadmaps.forEach(roadmap => {
      console.log(`- ${roadmap.id} (${roadmap.title})`);
    });

    // Check specific roadmap by ID
    const frontendRoadmap = await Roadmap.findOne({ id: 'frontend' });
    console.log('\nFrontend roadmap exists:', Boolean(frontendRoadmap));
    if (frontendRoadmap) {
      console.log('Frontend roadmap title:', frontendRoadmap.title);
      console.log('Frontend roadmap ID:', frontendRoadmap.id);
      console.log('Frontend roadmap has nodes:', frontendRoadmap.nodes.length);
      console.log('Frontend roadmap has edges:', frontendRoadmap.edges.length);
    }

    // Disconnect
    mongoose.disconnect();
    console.log('\nMongoDB disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Error checking roadmaps:', err);
    process.exit(1);
  }
};

checkRoadmaps();