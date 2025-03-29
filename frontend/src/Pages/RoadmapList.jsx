import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MigrationNotice from '../components/MigrationNotice';

function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch roadmaps from API
        try {
          console.log('Fetching roadmaps from API');
          const response = await api.get('/api/roadmaps');
          
          // Handle different API response formats
          if (Array.isArray(response.data)) {
            console.log(`Got ${response.data.length} roadmaps from API (direct format)`);
            setRoadmaps(response.data);
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            console.log(`Got ${response.data.data.length} roadmaps from API (nested format)`);
            setRoadmaps(response.data.data);
          } else {
            console.warn('Unexpected API response format, falling back to local data');
            throw new Error('Unexpected API response format');
          }
        } catch (apiErr) {
          console.warn('API fetch failed, using local data:', apiErr.message);
          
          // Fallback to local data if API fails
          const localData = await import('../data/roadmaps.json');
          console.log(`Loaded ${localData.roadmaps.length} roadmaps from local data`);
          setRoadmaps(localData.roadmaps);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading roadmaps:', err);
        setError('Failed to load roadmaps from any source.');
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filterRoadmaps = () => {
    // If no search query, return all roadmaps
    if (!searchQuery || searchQuery.trim() === '') {
      return roadmaps;
    }
    
    // Normalize search query
    const query = searchQuery.toLowerCase().trim();
    
    // Filter roadmaps
    return roadmaps.filter(roadmap => {
      // Safely check all searchable fields
      const titleMatch = roadmap.title?.toLowerCase().includes(query) || false;
      const descriptionMatch = roadmap.description?.toLowerCase().includes(query) || false;
      
      // Safely check prerequisites array if it exists
      const prerequisitesMatch = Array.isArray(roadmap.prerequisites) && 
        roadmap.prerequisites.some(prereq => 
          prereq?.toLowerCase().includes(query)
        );
      
      // Check if any resources match in title or description
      const resourcesMatch = Array.isArray(roadmap.resources) &&
        roadmap.resources.some(resource => 
          resource?.title?.toLowerCase().includes(query) ||
          resource?.description?.toLowerCase().includes(query)
        );
      
      // Check difficulty level
      const difficultyMatch = roadmap.difficulty?.toLowerCase().includes(query) || false;
      
      // Return true if any field matches
      return titleMatch || descriptionMatch || prerequisitesMatch || resourcesMatch || difficultyMatch;
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatHours = (hours) => {
    if (!hours) return 'N/A';
    if (hours < 1) return '< 1 hour';
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  const filteredRoadmaps = filterRoadmaps();

  return (
    <div className="container mx-auto px-4 py-8">
      <MigrationNotice />
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-purple-600 mb-4">Developer Roadmaps</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          A community effort to create roadmaps, guides and other educational content to help guide developers in picking up a path and guide their learnings.
        </p>
        
        {/* Create Your Own Roadmap Button */}
        <div className="mb-8">
          <Link
            to="/create-roadmap"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Your Own Roadmap
          </Link>
        </div>
        
        {/* Enhanced Search Bar */}
        <div className="relative max-w-xl mx-auto">
          <input 
            type="text" 
            placeholder="Search roadmaps by title, description, prerequisites, resources..." 
            className="w-full py-3 px-4 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
            value={searchQuery}
            onChange={handleSearch}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="p-2 text-gray-400 pointer-events-none">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Results count */}
      <div className="mb-6 text-gray-600 dark:text-gray-400 text-center">
        Found {filteredRoadmaps.length} roadmap{filteredRoadmaps.length !== 1 ? 's' : ''}
      </div>

      {/* Roadmap Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Create Roadmap Card */}
          {/* <Link
            to="/create-roadmap"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full relative text-center"
          >
            <div className="flex-grow flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Create Your Own Roadmap</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Design a custom learning path by adding nodes and connecting them.
              </p>
            </div>
            <div className="mt-auto">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Get Started</span>
            </div>
          </Link> */}
          
          {/* Regular Roadmap Cards */}
          {filteredRoadmaps.map((roadmap) => (
            <Link
              key={roadmap.id}
              to={`/roadmap/${roadmap.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full relative"
            >
              {/* Bookmark Icon */}
              {/* <div className="absolute top-4 right-4">
                <svg className="w-6 h-6 text-gray-300 hover:text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
              </div> */}

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{roadmap.title}</h2>
              
              {/* Tags Row */}
              {/* <div className="flex flex-wrap gap-2 mb-3">
                {roadmap.difficulty && (
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${getDifficultyColor(roadmap.difficulty)}`}>
                    {roadmap.difficulty.charAt(0).toUpperCase() + roadmap.difficulty.slice(1)}
                  </span>
                )}
                
                {roadmap.estimatedHours > 0 && (
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {formatHours(roadmap.estimatedHours)}
                  </span>
                )}
                
                {roadmap.isPopular && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div> */}
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">{roadmap.description}</p>
              
              {/* Prerequisites */}
              {/* {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prerequisites:</h3>
                  <div className="flex flex-wrap gap-1">
                    {roadmap.prerequisites.map((prereq, index) => (
                      <span key={index} className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded">
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )} */}
              
              {/* Author info */}
              {/* {roadmap.author && roadmap.author.name && (
                <div className="flex items-center mt-2 mb-4">
                  {roadmap.author.avatar ? (
                    <img src={roadmap.author.avatar} alt="Author" className="w-6 h-6 rounded-full mr-2" />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full mr-2 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                      {roadmap.author.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {roadmap.author.name}
                    {roadmap.author.role && ` • ${roadmap.author.role}`}
                  </span>
                </div>
              )} */}
              
              <div className="flex justify-between items-center mt-auto">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">View Roadmap</span>
                {/* {roadmap.resources && roadmap.resources.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {roadmap.resources.length} resource{roadmap.resources.length !== 1 ? 's' : ''}
                  </span>
                )} */}
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {filteredRoadmaps.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-1">No roadmaps found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria</p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default RoadmapList;