const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap');
const roadmapData = require('../../frontend/src/data/roadmaps.json');

// Direct import of database connection from main server file
require('dotenv').config();

const seedRoadmaps = async () => {
  try {
    // Use the MongoDB URI from environment variables
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

    // Delete existing roadmaps
    await Roadmap.deleteMany({});
    console.log('Existing roadmaps deleted...');

    // Create roadmaps from data
    const roadmapPromises = roadmapData.roadmaps.map(async (roadmap) => {
      // Map the category based on the ID
      let category = 'other';
      if (roadmap.id === 'frontend') category = 'frontend';
      else if (roadmap.id === 'backend') category = 'backend';
      else if (roadmap.id === 'fullstack') category = 'fullstack';
      else if (roadmap.id === 'devops') category = 'devops';
      else if (roadmap.id === 'ai-engineer') category = 'ai';
      else if (roadmap.id === 'data-scientist') category = 'data';
      else if (roadmap.id === 'android' || roadmap.id === 'ios') category = 'mobile';
      else if (roadmap.id === 'cybersecurity') category = 'security';
      else if (roadmap.id === 'blockchain') category = 'blockchain';

      // Mark AI Engineer as popular
      const isPopular = roadmap.id === 'ai-engineer';

      console.log(`Creating roadmap: ${roadmap.title}`);
      
      // Create the roadmap with additional metadata
      return new Roadmap({
        id: roadmap.id,
        title: roadmap.title,
        slug: roadmap.id,
        description: roadmap.description,
        category,
        nodes: roadmap.nodes,
        edges: roadmap.edges,
        isPopular
      }).save();
    });

    await Promise.all(roadmapPromises);
    console.log(`${roadmapData.roadmaps.length} roadmaps created successfully!`);

    // Disconnect and exit
    mongoose.disconnect();
    console.log('MongoDB disconnected...');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding roadmaps:', err);
    process.exit(1);
  }
};

seedRoadmaps();