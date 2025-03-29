import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaUser, FaUsers, FaLock, FaGlobe, FaTag, FaPlus, FaSort, FaThumbsUp, FaBookmark, FaComments, FaThumbtack } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import Spinner from '../common/Spinner';

const BowlDetail = () => {
  const { bowlId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth() || {}; // Provide default empty object
  
  // Get user from auth, or directly from localStorage as fallback
  const { user: authUser } = auth;
  const [user, setUser] = useState(authUser);
  
  // Ensure we have user data by also checking localStorage
  useEffect(() => {
    if (!user) {
      try {
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser) {
          setUser(localUser);
          console.log("User loaded from localStorage:", localUser);
        }
      } catch (err) {
        console.error("Error loading user from localStorage:", err);
      }
    }
  }, [user]);
  
  const { 
    currentBowl, 
    discussions, 
    fetchBowlById, 
    fetchDiscussionsByBowl,
    loading, 
    error,
    totalDiscussions,
    currentPage,
    totalPages
  } = useCommunity();
  
  const [sortOption, setSortOption] = useState('newest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  useEffect(() => {
    if (bowlId) {
      console.log("Fetching bowl:", bowlId);
      fetchBowlById(bowlId).then(data => {
        console.log("Bowl data received:", data);
      }).catch(err => {
        console.error("Error fetching bowl:", err);
      });
      
      console.log("Fetching discussions for bowl:", bowlId);
      fetchDiscussionsByBowl(bowlId, 1, 10, sortOption).then(data => {
        console.log("Discussions data received:", data);
      }).catch(err => {
        console.error("Error fetching discussions:", err);
      });
    }
  }, [bowlId, fetchBowlById, fetchDiscussionsByBowl, sortOption]);
  
  const handlePageChange = (page) => {
    fetchDiscussionsByBowl(bowlId, page, 10, sortOption);
  };
  
  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortOptions(false);
  };
  
  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };
  
  // Check if user is a moderator or creator
  const isModeratorOrCreator = () => {
    if (!user || !currentBowl) return false;
    
    const isCreator = currentBowl.createdBy?._id === user._id;
    const isModerator = currentBowl.moderators?.some(mod => mod._id === user._id);
    
    return isCreator || isModerator;
  };
  
  // Also log the state values for debugging
  console.log("BowlDetail state:", {
    currentBowl,
    discussions,
    loading,
    error,
    user,
    hasLocalUser: !!localStorage.getItem('user')
  });
  
  if (loading && !currentBowl) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
        <h3 className="font-semibold mb-2">Error Loading Content</h3>
        <p>{error}</p>
        <button 
          onClick={() => {
            fetchBowlById(bowlId);
            fetchDiscussionsByBowl(bowlId, 1, 10, sortOption);
          }}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!currentBowl) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Bowl not found</h3>
        <Link to="/community" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Community
        </Link>
      </div>
    );
  }
  
  // Get user token to check if logged in regardless of user object
  const hasToken = !!localStorage.getItem('token');
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/community" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-2" />
          Back to Community
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mr-2 flex items-center">
                {!currentBowl.isPublic && <FaLock className="text-gray-500 dark:text-gray-400 mr-2" size={18} />}
                {currentBowl.title}
              </h1>
              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center">
                {currentBowl.isPublic ? (
                  <>
                    <FaGlobe className="mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <FaLock className="mr-1" />
                    Private
                  </>
                )}
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">{currentBowl.description}</p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {currentBowl.tags && currentBowl.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full flex items-center"
                >
                  <FaTag className="mr-1" size={10} /> {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center mr-4">
                <div className="mr-1">Created by:</div>
                <div className="flex items-center">
                  {currentBowl.createdBy?.avatar ? (
                    <img
                      src={currentBowl.createdBy.avatar}
                      alt={currentBowl.createdBy.name || 'User'}
                      className="w-5 h-5 rounded-full mr-1"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-blue-500 dark:bg-blue-600 rounded-full mr-1 flex items-center justify-center text-white text-xs">
                      {(currentBowl.createdBy?.name || 'U').charAt(0)}
                    </div>
                  )}
                  <span>{currentBowl.createdBy?.name || 'Anonymous'}</span>
                </div>
              </div>
              
              <div>
                {currentBowl.createdAt && formatDistanceToNow(new Date(currentBowl.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          
          {/* Show button if user exists or token exists */}
          {(user || hasToken) && (
            <div className="mt-4 md:mt-0">
              <Link
                to={`/community/bowl/${bowlId}/create-discussion`}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <FaPlus className="mr-2" />
                Start Discussion
              </Link>
            </div>
          )}
        </div>
        
        {currentBowl.rules && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Bowl Rules</h3>
            <p className="text-yellow-700 dark:text-yellow-300 whitespace-pre-line">{currentBowl.rules}</p>
          </div>
        )}
        
        {/* Discussions Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Discussions</h2>
            
            <div className="relative">
              <button
                onClick={toggleSortOptions}
                className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <FaSort className="mr-2" />
                {sortOption === 'newest' && 'Newest'}
                {sortOption === 'oldest' && 'Oldest'}
                {sortOption === 'popular' && 'Popular'}
                {sortOption === 'pinned' && 'Pinned'}
              </button>
              
              {showSortOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={() => handleSortChange('newest')}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortOption === 'newest' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Newest
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSortChange('oldest')}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortOption === 'oldest' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Oldest
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSortChange('popular')}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortOption === 'popular' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Most Popular
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSortChange('pinned')}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortOption === 'pinned' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Pinned
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {loading && !discussions.length ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : discussions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discussions.map(discussion => (
                <DiscussionItem 
                  key={discussion._id} 
                  discussion={discussion} 
                  isModeratorOrCreator={isModeratorOrCreator}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-gray-200 dark:border-gray-700 rounded-md">
              <p className="text-gray-500 dark:text-gray-400">No discussions yet. Be the first to start a discussion!</p>
              {/* Show button if user exists or token exists */}
              {(user || hasToken) && (
                <Link
                  to={`/community/bowl/${bowlId}/create-discussion`}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="mr-2" />
                  Start Discussion
                </Link>
              )}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Discussion item component
const DiscussionItem = ({ discussion, isModeratorOrCreator }) => {
  const navigate = useNavigate();
  const { toggleLikeDiscussion, toggleBookmarkDiscussion, togglePinDiscussion } = useCommunity();
  
  // Get user from localStorage directly to ensure it's available
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    try {
      const localUser = JSON.parse(localStorage.getItem('user'));
      if (localUser) {
        setUser(localUser);
      }
    } catch (err) {
      console.error("Error loading user in DiscussionItem:", err);
    }
  }, []);
  
  const handleClick = (e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('button')) {
      return;
    }
    
    navigate(`/community/discussion/${discussion._id}`);
  };
  
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;
    
    await toggleLikeDiscussion(discussion._id);
  };
  
  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) return;
    
    await toggleBookmarkDiscussion(discussion._id);
  };
  
  const handlePin = async (e) => {
    e.stopPropagation();
    if (!isModeratorOrCreator()) return;
    
    await togglePinDiscussion(discussion._id);
  };
  
  return (
    <div
      onClick={handleClick}
      className={`bg-white dark:bg-gray-800 border ${
        discussion.isPinned ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700'
      } rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col h-full`}
    >
      {discussion.isPinned && (
        <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-xs mb-2">
          <FaThumbtack className="mr-1" />
          <span>Pinned Discussion</span>
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2">{discussion.title}</h3>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {discussion.tags && discussion.tags.map((tag, index) => (
          <span
            key={index}
            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full flex items-center"
          >
            <FaTag className="mr-1" size={8} /> {tag}
          </span>
        ))}
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3 flex-grow">{discussion.body}</p>
      
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center mr-3">
            {discussion.userId?.avatar ? (
              <img
                src={discussion.userId.avatar}
                alt={discussion.userId.name || 'User'}
                className="w-4 h-4 rounded-full mr-1"
              />
            ) : (
              <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded-full mr-1 flex items-center justify-center text-white text-xs">
                {(discussion.userId?.name || 'U').charAt(0)}
              </div>
            )}
            <span className="truncate max-w-[60px]">{discussion.userId?.name || 'Anonymous'}</span>
          </div>
          
          <div>
            {discussion.createdAt && 
              formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLike}
            className={`flex items-center text-xs ${
              discussion.isLiked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <FaThumbsUp className="mr-1" />
            <span>{discussion.likes || 0}</span>
          </button>
          
          <button
            onClick={handleBookmark}
            className={`flex items-center text-xs ${
              discussion.isBookmarked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <FaBookmark className="mr-1" />
          </button>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <FaComments className="mr-1" />
            <span>{discussion.commentCount || 0}</span>
          </div>
          
          {isModeratorOrCreator() && (
            <button
              onClick={handlePin}
              className={`flex items-center text-xs ${
                discussion.isPinned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'
              }`}
            >
              <FaThumbtack className="mr-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BowlDetail; 