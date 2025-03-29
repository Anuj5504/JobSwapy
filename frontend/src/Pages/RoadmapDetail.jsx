import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactFlow, { 
  Controls, 
  Background, 
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../services/api';

const nodeTypes = {};

function RoadmapDetail() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Helper function to style nodes based on their level and type
  function getNodeStyle(node) {
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
        borderLeft: node.data.parent ? '4px solid #6366f1' : '1px solid #e2e8f0',
        boxShadow: node.data.level > 0 ? `0 0 0 ${node.data.level}px rgba(99, 102, 241, 0.2)` : 'none'
      };
    }

    // Type-based styling
    if (node.type === 'input') {
      return { ...baseStyle, background: '#6366f1' };
    } else if (node.type === 'output') {
      return { ...baseStyle, background: '#10b981' };
    }
    
    // Level-based styling for default nodes
    const level = node.data?.level || 0;
    if (level === 0) {
      return { ...baseStyle, background: '#3b82f6', fontWeight: 'bold' }; // Top level
    } else if (level === 1) {
      return { ...baseStyle, background: '#8b5cf6', borderLeft: '4px solid #6366f1' }; // Second level
    } else if (level === 2) {
      return { ...baseStyle, background: '#ec4899', borderLeft: '4px solid #8b5cf6' }; // Third level
    } else {
      return { 
        ...baseStyle, 
        background: '#f43f5e', 
        borderLeft: '4px solid #ec4899',
        fontSize: '0.9rem'
      }; // Fourth+ level
    }
  }

  // Process nodes with styling based on hierarchy
  function processNodes(roadmapData) {
    if (!roadmapData.nodes || !Array.isArray(roadmapData.nodes)) {
      console.warn('No nodes found in roadmap data');
      return [];
    }
    
    return roadmapData.nodes.map(node => {
      // Ensure node data has required fields
      const nodeData = node.data || {};
      const parent = nodeData.parent || '';
      const level = nodeData.level || 0;
      
      return {
        ...node,
        data: {
          ...nodeData,
          parent,
          level,
          label: nodeData.label || 'Untitled Node'
        },
        style: node.style || getNodeStyle({
          ...node,
          data: {
            ...nodeData,
            parent,
            level
          }
        }),
        draggable: false
      };
    });
  }

  // Process edges with styling based on parent-child relationships
  function processEdges(roadmapData) {
    if (!roadmapData.edges || !Array.isArray(roadmapData.edges)) {
      console.warn('No edges found in roadmap data');
      return [];
    }
    
    return roadmapData.edges.map(edge => {
      // Find source and target nodes to determine if it's a parent-child relationship
      const sourceNode = roadmapData.nodes.find(n => n.id === edge.source);
      const targetNode = roadmapData.nodes.find(n => n.id === edge.target);
      
      // Check if this is a parent-child edge
      const isParentChild = targetNode?.data?.parent === sourceNode?.id;
      
      return {
        ...edge,
        animated: edge.animated || isParentChild,
        style: edge.style || { 
          stroke: isParentChild ? '#6366f1' : '#94a3b8', 
          strokeWidth: isParentChild ? 3 : 2,
          strokeDasharray: isParentChild ? '' : '5,5'
        },
        type: edge.type || 'smoothstep',
        markerEnd: edge.markerEnd || {
          type: 'arrowclosed',
          color: isParentChild ? '#6366f1' : '#94a3b8',
        }
      };
    });
  }

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching roadmap data for ID: ${id}`);
        
        // Prioritize fetching from API first
        try {
          console.log(`Attempting to fetch from API for roadmap ID: ${id}`);
          const response = await api.get(`/api/roadmaps/${id}`);
          
          // API might return data directly or wrapped in a data object
          const fetchedRoadmap = response.data.data || response.data;
          
          if (fetchedRoadmap) {
            console.log('Got roadmap from API');
            setRoadmap(fetchedRoadmap);
            
            // Process nodes and edges
            const processedNodes = processNodes(fetchedRoadmap);
            const processedEdges = processEdges(fetchedRoadmap);
            
            setNodes(processedNodes);
            setEdges(processedEdges);
            setLoading(false);
            return; // Exit early if API fetch succeeds
          }
        } catch (apiErr) {
          console.warn('API fetch failed:', apiErr.message);
          // Continue to fallback data sources
        }
        
        // Fallback to local roadmap data
        console.log(`Falling back to local roadmap data for ID: ${id}`);
        try {
          const localData = await import('../data/roadmaps.json');
          const localRoadmap = localData.roadmaps.find(r => r.id === id);
          
          if (localRoadmap) {
            console.log('Found roadmap in local data');
            setRoadmap(localRoadmap);
            
            // Process nodes and edges
            const processedNodes = processNodes(localRoadmap);
            const processedEdges = processEdges(localRoadmap);
            
            setNodes(processedNodes);
            setEdges(processedEdges);
            setLoading(false);
            return; // Exit if found in local data
          }
        } catch (localErr) {
          console.warn('Local data fetch failed:', localErr.message);
        }
        
        // If we reach here, the roadmap wasn't found in any source
        setError(`Roadmap with ID '${id}' not found. Please check the URL or return to the roadmaps list.`);
        setLoading(false);
      } catch (err) {
        console.error('Error loading roadmap:', err);
        setError('Failed to load roadmap from any source.');
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Roadmap</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {error}
        </p>
        <Link
          to="/roadmaps"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Roadmaps
        </Link>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Roadmap Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The roadmap you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/roadmaps"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="mb-8">
        <Link
          to="/roadmaps"
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Roadmaps
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{roadmap.title} Roadmap</h1>
        <p className="text-gray-600 dark:text-gray-400">{roadmap.description}</p>
      </div>

      <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap 
            nodeColor={node => {
              if (node.type === 'input') return '#6366f1';
              if (node.type === 'output') return '#10b981';
              return '#3b82f6';
            }}
            style={{ background: '#f3f4f6' }}
          />
          <Background color="#94a3b8" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default RoadmapDetail;