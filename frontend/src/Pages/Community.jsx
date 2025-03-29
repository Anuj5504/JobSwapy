import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BowlList from '../components/community/BowlList';
import BowlDetail from '../components/community/BowlDetail';
import DiscussionDetail from '../components/community/DiscussionDetail';
import CreateBowl from '../components/community/CreateBowl';
import CreateDiscussion from '../components/community/CreateDiscussion';
import Spinner from '../components/common/Spinner';
import { FaSearch, FaPlus, FaFilter, FaUsers, FaFire, FaClock } from 'react-icons/fa';

const Community = () => {
  // Component state
  const [user, setUser] = useState(null);
  const [bowls, setBowls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentTags, setCurrentTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  // Load user from localStorage on component mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }, []);

  // Function to fetch bowls
  const fetchBowls = async (page = 1, limit = 10, tags = '', search = '', sort = sortBy) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:5000/api/community/bowls?page=${page}&limit=${limit}&tags=${tags}&search=${search}&sort=${sort}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setBowls(response.data.data);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch bowls:', err);
      setError(err.response?.data?.message || 'Failed to load bowls');
      setLoading(false);
    }
  };

  // Fetch bowls on component mount
  useEffect(() => {
    fetchBowls(1, 10, '', '', sortBy);
    
    // Clean up error on unmount
    return () => setError(null);
  }, [sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBowls(1, 10, currentTags.join(','), search, sortBy);
  };

  const handleTagChange = (e) => {
    setTags(e.target.value);
  };

  const addTag = () => {
    if (tags.trim() && !currentTags.includes(tags.trim())) {
      setCurrentTags([...currentTags, tags.trim()]);
      setTags('');
    }
  };

  const removeTag = (tagToRemove) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  const handlePageChange = (page) => {
    fetchBowls(page, 10, currentTags.join(','), search, sortBy);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const applyFilters = () => {
    fetchBowls(1, 10, currentTags.join(','), search, sortBy);
    setShowFilters(false);
  };
  
  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <div className="container mx-auto px-4 pb-8 mt-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Community</h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                <button 
                  onClick={() => handleSortChange('newest')} 
                  className={`px-3 py-2 flex items-center text-sm ${sortBy === 'newest' ? 'bg-blue-500 dark:bg-blue-600 text-white' : ''}`}
                >
                  <FaClock className="mr-1" /> Newest
                </button>
                <button 
                  onClick={() => handleSortChange('popular')} 
                  className={`px-3 py-2 flex items-center text-sm ${sortBy === 'popular' ? 'bg-blue-500 dark:bg-blue-600 text-white' : ''}`}
                >
                  <FaFire className="mr-1" /> Popular
                </button>
                <button 
                  onClick={() => handleSortChange('active')} 
                  className={`px-3 py-2 flex items-center text-sm ${sortBy === 'active' ? 'bg-blue-500 dark:bg-blue-600 text-white' : ''}`}
                >
                  <FaUsers className="mr-1" /> Active
                </button>
              </div>
              
              <button 
                onClick={toggleFilters}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <FaFilter className="mr-2" />
                Filters
              </button>
              
              {user && (
                <Link 
                  to="/community/create-bowl" 
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  <FaPlus className="mr-2" />
                  Create Bowl
                </Link>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden transition-colors">
              <input
                type="text"
                placeholder="Search bowls..."
                className="flex-grow px-4 py-3 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button 
                type="submit" 
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-3 transition-colors"
              >
                <FaSearch />
              </button>
            </div>
          </form>
          
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-5 rounded-md mb-6 transition-colors">
              <h3 className="font-semibold mb-3">Filter by Tags</h3>
              <div className="flex items-center mb-4">
                <input
                  type="text"
                  placeholder="Add tags..."
                  className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  value={tags}
                  onChange={handleTagChange}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-r-md transition-colors"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {currentTags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full flex items-center transition-colors"
                  >
                    {tag}
                    <button 
                      type="button" 
                      className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                      onClick={() => removeTag(tag)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {currentTags.length === 0 && (
                  <span className="italic text-gray-500 dark:text-gray-400">No tags selected</span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTags([]);
                    setShowFilters(false);
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded-md mb-6 transition-colors">
              {error}
            </div>
          )}
          
          <Routes>
            <Route 
              path="/" 
              element={
                <>
                  {loading ? (
                    <div className="flex justify-center py-20">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <>
                      <BowlList bowls={bowls} />
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                          <nav className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors"
                            >
                              Previous
                            </button>
                            
                            {[...Array(totalPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => handlePageChange(i + 1)}
                                className={`px-3 py-2 rounded-md ${
                                  currentPage === i + 1
                                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                } transition-colors`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            
                            <button
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      )}
                    </>
                  )}
                </>
              }
            />
            <Route path="/bowl/:bowlId" element={<BowlDetail />} />
            <Route path="/discussion/:discussionId" element={<DiscussionDetail />} />
            <Route path="/create-bowl" element={<CreateBowl />} />
            <Route path="/bowl/:bowlId/create-discussion" element={<CreateDiscussion />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Community; 