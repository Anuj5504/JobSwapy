import { useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../services/api';

// Custom Node Component
const CustomNode = ({ data, selected }) => {
  const handleStyle = {
    background: '#3b82f6', 
    width: '12px', 
    height: '12px', 
    border: '2px solid white',
    transition: 'all 0.2s ease',
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md border-2 ${selected ? 'border-blue-500' : 'border-gray-300'}`} 
         style={{
           backgroundColor: data.color || '#ffffff',
           color: getContrastColor(data.color || '#ffffff'),
           minWidth: '180px',
           minHeight: '60px',
           width: 'auto'
         }}>
      {/* Source handle (top) */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ ...handleStyle, top: '-6px' }}
        id="top"
        className="hover:scale-125"
      />
      
      {/* Source handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, right: '-6px' }}
        id="right"
        className="hover:scale-125"
      />
      
      {/* Target handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, left: '-6px' }}
        id="left"
        className="hover:scale-125"
      />
      
      {/* Target handle (bottom) */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ ...handleStyle, bottom: '-6px' }}
        id="bottom"
        className="hover:scale-125"
      />
      
      <div className="flex flex-col">
        <div className="font-bold text-center">{data.label}</div>
        {data.description && (
          <div className="mt-1 text-sm text-center">{data.description}</div>
        )}
      </div>
    </div>
  );
};

// Function to determine text color based on background color for contrast
function getContrastColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Node types mapping
const nodeTypes = {
  custom: CustomNode,
};

function CreateRoadmap() {
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeColor, setNodeColor] = useState('#6366f1');
  const [nodeType, setNodeType] = useState('default');
  const [nodeParent, setNodeParent] = useState('');
  const [nodeLevel, setNodeLevel] = useState(0);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapDescription, setRoadmapDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Connection line style
  const connectionLineStyle = { stroke: '#3b82f6', strokeWidth: 3, strokeDasharray: '5,5' };
  
  // Default edge options
  const defaultEdgeOptions = {
    style: { stroke: '#3b82f6', strokeWidth: 3 },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#3b82f6',
      width: 20,
      height: 20,
    },
    animated: true,
  };

  // Handle when flow is loaded
  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
    
    // Set the initial viewport to zoom out a bit for better overview
    instance.setViewport({ x: 0, y: 0, zoom: 0.8 });
  }, []);

  // Handle connection between nodes
  const onConnect = useCallback((params) => {
    // Create unique edge ID
    const edgeId = `e${params.source}-${params.target}`;
    
    // Check if edge already exists
    const edgeExists = edges.some(edge => 
      edge.source === params.source && edge.target === params.target
    );
    
    if (!edgeExists) {
      setEdges((eds) => addEdge({ ...params, id: edgeId, ...defaultEdgeOptions }, eds));
    }
  }, [edges, setEdges, defaultEdgeOptions]);

  // Handle node click
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setNodeName(node.data.label);
    setNodeDescription(node.data.description || '');
    setNodeColor(node.data.color || '#6366f1');
    setNodeType(node.type || 'default');
    setNodeParent(node.data.parent || '');
    setNodeLevel(node.data.level || 0);
    setIsEditing(true);
    setSelectedEdge(null);
  }, []);

  // Handle edge click
  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setIsEditing(false);
  }, []);

  // Handle background click
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsEditing(false);
  }, []);

  // Calculate a grid position for new nodes to avoid overlapping
  const getNewNodePosition = useCallback(() => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return { x: 50, y: 50 };
    
    const containerWidth = reactFlowWrapper.current.offsetWidth;
    const containerHeight = reactFlowWrapper.current.offsetHeight;
    
    // If no nodes exist yet, place the first node in the center
    if (nodes.length === 0) {
      return reactFlowInstance.project({
        x: containerWidth / 2,
        y: containerHeight / 3
      });
    }
    
    // Find the rightmost node's position
    let maxX = Math.max(...nodes.map(node => node.position.x));
    let correspondingY = nodes.find(node => node.position.x === maxX)?.position.y || 100;
    
    // Add some spacing
    const spacing = 250;
    
    // If we're getting too far to the right, start a new column
    if (maxX > containerWidth - 300) {
      // Find the lowest node's position
      const maxY = Math.max(...nodes.map(node => node.position.y));
      return reactFlowInstance.project({ 
        x: 100, 
        y: maxY + spacing 
      });
    }
    
    // Otherwise, place to the right of the rightmost node
    return reactFlowInstance.project({ 
      x: maxX + spacing, 
      y: correspondingY 
    });
  }, [reactFlowInstance, nodes, reactFlowWrapper]);

  // Add new node
  const onAddNode = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const id = uuidv4();
    const newPosition = getNewNodePosition();
    
    // Default parent and level
    let parent = '';
    let level = 0;
    
    // If a node is selected, make the new node its child
    if (selectedNode) {
      parent = selectedNode.id;
      level = (selectedNode.data.level || 0) + 1;
      
      // Position the child below its parent
      newPosition.y += 100;
      newPosition.x = selectedNode.position.x;
    }
    
    const newNode = {
      id,
      type: 'custom',
      position: newPosition,
      data: { 
        label: 'New Node',
        description: 'Add description here',
        color: '#6366f1',
        parent,
        level
      }
    };
    
    setNodes((nds) => nds.concat(newNode));
    
    // If this is a child node, automatically create an edge
    if (parent) {
      const edgeId = `e${parent}-${id}`;
      const newEdge = {
        id: edgeId,
        source: parent,
        target: id,
        ...defaultEdgeOptions
      };
      setEdges((eds) => eds.concat(newEdge));
    }
    
    setSelectedNode(newNode);
    setNodeName(newNode.data.label);
    setNodeDescription(newNode.data.description);
    setNodeColor(newNode.data.color);
    setNodeParent(newNode.data.parent);
    setNodeLevel(newNode.data.level);
    setNodeType('default');
    setIsEditing(true);
  }, [reactFlowInstance, setNodes, getNewNodePosition, selectedNode, setEdges, defaultEdgeOptions]);

  // Update selected node
  const onUpdateNode = useCallback(() => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: nodeName,
              description: nodeDescription,
              color: nodeColor,
              parent: nodeParent,
              level: nodeLevel
            },
            type: nodeType === 'default' ? 'custom' : nodeType,
          };
        }
        return node;
      })
    );
    
    setIsEditing(false);
  }, [selectedNode, nodeName, nodeDescription, nodeColor, nodeType, nodeParent, nodeLevel, setNodes]);

  // Delete selected node
  const onDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== selectedNode.id && edge.target !== selectedNode.id
    ));
    
    setSelectedNode(null);
    setIsEditing(false);
  }, [selectedNode, setNodes, setEdges]);

  // Delete selected edge
  const onDeleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    
    setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  // Save roadmap
  const onSaveRoadmap = async () => {
    if (!roadmapTitle.trim()) {
      setError('Please enter a roadmap title');
      return;
    }

    if (nodes.length < 2) {
      setError('Please add at least 2 nodes to your roadmap');
      return;
    }

    if (edges.length < 1) {
      setError('Please connect your nodes with at least one edge');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Generate a readable ID from the title
      const id = roadmapTitle.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .concat('-', Math.floor(Math.random() * 1000));
      
      const newRoadmap = {
        id,
        slug: id,
        title: roadmapTitle,
        description: roadmapDescription,
        category: 'other',
        difficulty: 'intermediate',
        estimatedHours: 40,
        prerequisites: [],
        author: {
          name: 'Custom Roadmap Creator',
          role: 'User'
        },
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type === 'custom' ? 'default' : node.type,
          data: {
            ...node.data,
            parent: node.data.parent || '',
            level: node.data.level || 0
          },
          position: node.position,
          style: {
            background: node.data.color || '#6366f1',
            color: getContrastColor(node.data.color || '#6366f1'),
            minWidth: '180px',
            width: 'auto'
          }
        })),
        edges: edges
      };
      
      console.log('Saving roadmap to database...');
      
      try {
        const response = await api.post('/api/roadmaps', newRoadmap);
        
        if (response.data) {
          console.log('Roadmap saved to database successfully');
          setIsSaving(false);
          navigate(`/roadmap/${response.data.id || id}`);
        } else {
          throw new Error('No data returned from API');
        }
      } catch (apiErr) {
        console.error('Failed to save to database:', apiErr.message);
        setError(`Failed to save roadmap: ${apiErr.message}. Please try again later.`);
        setIsSaving(false);
      }
    } catch (err) {
      console.error('Error saving roadmap:', err);
      setError('Failed to save roadmap. Please try again.');
      setIsSaving(false);
    }
  };

  // Handle node color change
  const handleColorChange = (e) => {
    setNodeColor(e.target.value);
  };

  // Node type options
  const nodeTypeOptions = [
    { value: 'default', label: 'Default' },
    { value: 'input', label: 'Start Node' },
    { value: 'output', label: 'End Node' },
    { value: 'special', label: 'Special Node' }
  ];

  return (
    <div className="container mx-auto p-4 flex flex-col" style={{ height: "90vh" }}>
      <div className="mb-6">
        <Link
          to="/roadmaps"
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Roadmaps
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Your Own Roadmap</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Design a custom learning path by adding nodes and connecting them.
        </p>
        
        {/* Roadmap Details Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="roadmap-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Roadmap Title
            </label>
            <input
              id="roadmap-title"
              type="text"
              value={roadmapTitle}
              onChange={(e) => setRoadmapTitle(e.target.value)}
              placeholder="Enter roadmap title"
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="roadmap-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              id="roadmap-description"
              type="text"
              value={roadmapDescription}
              onChange={(e) => setRoadmapDescription(e.target.value)}
              placeholder="Enter roadmap description"
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Add connection guide */}
      <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-3 text-yellow-700">
        <h3 className="font-bold mb-1">How to Connect Nodes:</h3>
        <ol className="list-decimal ml-5 text-sm">
          <li>Click and drag from the <strong>blue connection points</strong> on the edges of any node</li>
          <li>Drag to another node and release to create a connection</li>
          <li>You can connect one node to multiple other nodes</li>
          <li>Click on any connection line to select it for deletion</li>
        </ol>
      </div>
      
      {/* ReactFlow Canvas - Increased height */}
      <div 
        className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" 
        ref={reactFlowWrapper}
        style={{ height: "calc(100% - 170px)", minHeight: "500px" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionLineStyle={connectionLineStyle}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          snapToGrid={true}
          snapGrid={[15, 15]}
        >
          <Controls position="bottom-right" />
          <MiniMap 
            nodeColor={(node) => {
              return node.data.color || '#6366f1';
            }}
            style={{ background: '#f3f4f6' }}
          />
          <Background color="#94a3b8" gap={16} />
          
          {/* Add connection helper panel */}
          <Panel position="top-left" className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Drag from the blue handles to connect nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-blue-500"></div>
                <span>Click on lines to select connections</span>
              </div>
            </div>
          </Panel>
          
          {/* Action Panel */}
          <Panel position="top-right" className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-md">
            <div className="flex flex-col gap-2">
              <button
                onClick={onAddNode}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Node
              </button>
              {selectedNode && (
                <button
                  onClick={onDeleteNode}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Delete Node
                </button>
              )}
              {selectedEdge && (
                <button
                  onClick={onDeleteEdge}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Delete Connection
                </button>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Bottom Tool Panel */}
      <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-1 min-w-[320px]">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isEditing ? 'Edit Node' : 'Node Properties'}
            </h3>
            
            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="node-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Node Title
                  </label>
                  <input
                    id="node-name"
                    type="text"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder="Enter node title"
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="node-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Node Description
                  </label>
                  <input
                    id="node-description"
                    type="text"
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    placeholder="Enter node description"
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="node-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Node Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="node-color"
                      type="color"
                      value={nodeColor}
                      onChange={handleColorChange}
                      className="h-10 w-10 border-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {nodeColor}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="node-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Node Type
                  </label>
                  <select
                    id="node-type"
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    {nodeTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="node-parent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Parent Node (for hierarchy)
                  </label>
                  <select
                    id="node-parent"
                    value={nodeParent}
                    onChange={(e) => {
                      setNodeParent(e.target.value);
                      // Update level based on parent
                      if (e.target.value === '') {
                        setNodeLevel(0);
                      } else {
                        const parentNode = nodes.find(n => n.id === e.target.value);
                        if (parentNode) {
                          setNodeLevel((parentNode.data.level || 0) + 1);
                        }
                      }
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">None (Top Level)</option>
                    {nodes.filter(n => n.id !== selectedNode.id).map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.data.label} {node.data.level > 0 ? `(Level ${node.data.level})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="node-level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hierarchy Level
                  </label>
                  <input
                    id="node-level"
                    type="number"
                    min="0"
                    value={nodeLevel}
                    onChange={(e) => setNodeLevel(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={onUpdateNode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Update Node
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                {selectedEdge 
                  ? 'Connection selected. Use the panel to delete if needed.' 
                  : 'Click on a node to edit its properties.'}
              </p>
            )}
          </div>
          
          <div className="flex-1 min-w-[320px]">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Instructions</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Click "Add Node" to create new nodes</li>
              <li><strong>Click and drag from the blue handles</strong> on each node to connect them</li>
              <li>Click on a node to edit its properties</li>
              <li>Use the top-right panel to add/delete elements</li>
              <li>Zoom in/out using mouse wheel or pinch gesture</li>
              <li>Drag the canvas to pan around</li>
              <li>Click "Save Roadmap" when you're done</li>
            </ul>
          </div>
          
          <div className="flex-1 min-w-[320px] flex items-end justify-end">
            <button
              onClick={onSaveRoadmap}
              disabled={isSaving}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {isSaving ? 'Saving...' : 'Save Roadmap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateRoadmap;