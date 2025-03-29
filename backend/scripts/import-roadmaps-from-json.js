const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Roadmap = require('../models/Roadmap');

/**
 * Script to import roadmaps from a JSON file into the database
 * Usage: node scripts/import-roadmaps-from-json.js <json-file-path>
 * Example: node scripts/import-roadmaps-from-json.js ./data/roadmaps-data.json
 */

async function importRoadmaps() {
  // Get the file path from command line arguments
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Please provide a JSON file path as an argument');
    console.error('Example: node scripts/import-roadmaps-from-json.js ./data/roadmaps-data.json');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }
  
  try {
    // Read and parse the JSON file
    console.log(`Reading roadmap data from ${fullPath}`);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const roadmapsData = JSON.parse(fileContent);
    
    if (!Array.isArray(roadmapsData)) {
      console.error('The JSON file must contain an array of roadmaps');
      process.exit(1);
    }
    
    console.log(`Found ${roadmapsData.length} roadmaps in the JSON file`);
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully!');
    
    // Process each roadmap
    for (const roadmapData of roadmapsData) {
      // Check if roadmap has an ID
      if (!roadmapData.id) {
        console.error('Skipping roadmap without ID:', roadmapData.title || 'Unknown');
        continue;
      }
      
      // Check if roadmap exists
      const existingRoadmap = await Roadmap.findOne({ id: roadmapData.id });
      
      if (existingRoadmap) {
        console.log(`Updating existing roadmap: ${roadmapData.title} (${roadmapData.id})`);
        await Roadmap.findOneAndUpdate(
          { id: roadmapData.id },
          { ...roadmapData, updatedAt: new Date() },
          { new: true }
        );
      } else {
        console.log(`Creating new roadmap: ${roadmapData.title} (${roadmapData.id})`);
        
        // Add styling to nodes if not present
        if (roadmapData.nodes && Array.isArray(roadmapData.nodes)) {
          roadmapData.nodes = roadmapData.nodes.map(node => {
            if (node.style) return node;
            
            // Add styling based on node level
            let style = {};
            const level = node.data?.level || 0;
            
            if (node.type === 'input') {
              style = {
                background: '#6366f1',
                color: '#ffffff',
                fontWeight: 'bold',
                width: 250,
                padding: '15px',
                borderRadius: '8px'
              };
            } else if (node.type === 'output') {
              style = {
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 'bold',
                width: 250,
                padding: '15px',
                borderRadius: '8px'
              };
            } else if (level === 1) {
              style = {
                background: '#3b82f6',
                color: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #6366f1',
                borderRadius: '8px',
                padding: '10px',
                width: 250
              };
            } else if (level === 2) {
              style = {
                background: '#8b5cf6',
                color: '#ffffff',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6',
                padding: '10px',
                width: 250,
                boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)'
              };
            } else if (level === 3) {
              style = {
                background: '#ec4899',
                color: '#ffffff',
                borderRadius: '8px',
                borderLeft: '4px solid #8b5cf6',
                padding: '10px',
                width: 250,
                boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)'
              };
            } else if (level === 4) {
              style = {
                background: '#f43f5e',
                color: '#ffffff',
                borderRadius: '8px',
                borderLeft: '4px solid #ec4899',
                padding: '10px',
                width: 250,
                fontSize: '0.9rem',
                boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.2)'
              };
            } else {
              style = {
                background: node.data?.color || '#3b82f6',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '10px',
                width: 250
              };
            }
            
            return { ...node, style };
          });
        }
        
        // Add styling to edges if not present
        if (roadmapData.edges && Array.isArray(roadmapData.edges)) {
          roadmapData.edges = roadmapData.edges.map(edge => {
            if (edge.style) return edge;
            
            const sourceNode = roadmapData.nodes.find(n => n.id === edge.source);
            const targetNode = roadmapData.nodes.find(n => n.id === edge.target);
            const isParentChild = targetNode?.data?.parent === sourceNode?.id;
            
            return {
              ...edge,
              animated: edge.animated || isParentChild,
              style: { 
                stroke: isParentChild ? '#6366f1' : '#94a3b8', 
                strokeWidth: isParentChild ? 3 : 2,
                strokeDasharray: isParentChild ? '' : '5,5'
              },
              type: edge.type || 'smoothstep',
              markerEnd: {
                type: 'arrowclosed',
                color: isParentChild ? '#6366f1' : '#94a3b8',
              }
            };
          });
        }
        
        // Create the roadmap
        await Roadmap.create({
          ...roadmapData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // Count roadmaps in database
    const count = await Roadmap.countDocuments();
    console.log(`Successfully processed all roadmaps! Total in database: ${count}`);
    
    // List all roadmaps
    const roadmaps = await Roadmap.find().select('id title -_id');
    console.log('Available roadmaps:');
    roadmaps.forEach(roadmap => {
      console.log(`- ${roadmap.id} (${roadmap.title})`);
    });
    
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error importing roadmaps:', error);
    if (mongoose.connection.readyState !== 0) {
      mongoose.disconnect();
    }
    process.exit(1);
  }
}

importRoadmaps(); 