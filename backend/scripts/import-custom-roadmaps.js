const mongoose = require('mongoose');
require('dotenv').config();
const Roadmap = require('../models/Roadmap');

/**
 * This script is designed to help users migrate custom roadmaps
 * from localStorage to MongoDB database. It should be run in a browser console.
 * 
 * Instructions for users:
 * 1. Copy your localStorage custom roadmaps with this code in browser console:
 *    console.log(JSON.stringify(JSON.parse(localStorage.getItem('customRoadmaps') || '[]')))
 * 2. Save the output to a file (e.g., custom-roadmaps.json)
 * 3. Run this script with the file path: node scripts/import-custom-roadmaps.js ./custom-roadmaps.json
 */

// Helper function to style nodes based on hierarchy
function getStylesForNode(node) {
  const level = node.data?.level || 0;
  const hasParent = !!node.data?.parent;
  
  // Base style
  const baseStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px',
    width: 250,
    color: 'white'
  };
  
  // Custom color if specified in node data
  if (node.data?.color) {
    return {
      ...baseStyle,
      background: node.data.color,
      borderLeft: hasParent ? '4px solid #6366f1' : '1px solid #e2e8f0',
      boxShadow: level > 0 ? `0 0 0 ${level}px rgba(99, 102, 241, 0.2)` : 'none'
    };
  }
  
  // Type-based styling
  if (node.type === 'input') {
    return { ...baseStyle, background: '#6366f1' };
  } else if (node.type === 'output') {
    return { ...baseStyle, background: '#10b981' };
  }
  
  // Level-based styling
  if (level === 0) {
    return { ...baseStyle, background: '#3b82f6', fontWeight: 'bold' };
  } else if (level === 1) {
    return { ...baseStyle, background: '#8b5cf6', borderLeft: '4px solid #6366f1' };
  } else if (level === 2) {
    return { ...baseStyle, background: '#ec4899', borderLeft: '4px solid #8b5cf6' };
  } else {
    return { 
      ...baseStyle, 
      background: '#f43f5e', 
      borderLeft: '4px solid #ec4899',
      fontSize: '0.9rem'
    };
  }
}

// Helper function to style edges based on parent-child relationships
function getStylesForEdge(edge, nodes) {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  const isParentChild = targetNode?.data?.parent === sourceNode?.id;
  
  return {
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
}

async function importCustomRoadmaps() {
  // Check for file path argument
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a JSON file path as an argument');
    console.error('Example: node scripts/import-custom-roadmaps.js ./custom-roadmaps.json');
    process.exit(1);
  }
  
  try {
    // Read the file
    const fs = require('fs');
    console.log(`Reading custom roadmaps from ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const customRoadmaps = JSON.parse(fileContent);
    
    if (!Array.isArray(customRoadmaps) || customRoadmaps.length === 0) {
      console.error('No custom roadmaps found in the file or invalid format');
      process.exit(1);
    }
    
    console.log(`Found ${customRoadmaps.length} custom roadmaps to import`);
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully!');
    
    // Process each roadmap
    for (const roadmap of customRoadmaps) {
      try {
        // Check if roadmap already exists
        const existingRoadmap = await Roadmap.findOne({ id: roadmap.id });
        
        if (existingRoadmap) {
          console.log(`Roadmap "${roadmap.title}" (${roadmap.id}) already exists, skipping`);
          continue;
        }
        
        // Ensure roadmap has required fields
        if (!roadmap.id || !roadmap.title) {
          console.warn(`Skipping roadmap with missing required fields: ${roadmap.id || 'unknown ID'}`);
          continue;
        }
        
        // Ensure nodes have proper styling
        const processedNodes = roadmap.nodes?.map(node => ({
          ...node,
          data: {
            ...node.data,
            parent: node.data?.parent || '',
            level: node.data?.level || 0
          },
          style: node.style || getStylesForNode(node)
        })) || [];
        
        // Ensure edges have proper styling
        const processedEdges = roadmap.edges?.map(edge => ({
          ...edge,
          ...getStylesForEdge(edge, processedNodes)
        })) || [];
        
        // Prepare roadmap for saving
        const roadmapToSave = {
          ...roadmap,
          slug: roadmap.slug || roadmap.id,
          nodes: processedNodes,
          edges: processedEdges,
          createdAt: roadmap.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        // Save to database
        await Roadmap.create(roadmapToSave);
        console.log(`Imported roadmap: "${roadmap.title}" (${roadmap.id})`);
      } catch (err) {
        console.error(`Error importing roadmap ${roadmap.id || 'unknown'}:`, err.message);
      }
    }
    
    // Print summary
    const count = await Roadmap.countDocuments();
    console.log(`\nImport complete. Total roadmaps in database: ${count}`);
    
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('Error importing custom roadmaps:', err);
    if (mongoose.connection.readyState !== 0) {
      mongoose.disconnect();
    }
  }
}

importCustomRoadmaps(); 