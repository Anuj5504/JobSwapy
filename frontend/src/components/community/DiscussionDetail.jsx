import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FaArrowLeft, 
  FaRegComment, 
  FaReply, 
  FaThumbsUp, 
  FaBookmark, 
  FaTrash, 
  FaEdit,
  FaThumbtack,
  FaTag, 
  FaPoll,
  FaVoteYea,
  FaRegClock
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import Spinner from '../common/Spinner';

const DiscussionDetail = () => {
  const { discussionId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth() || {};
  
  // Get user from auth context or localStorage as fallback
  const [user, setUser] = useState(auth.user);
  
  // Load user from localStorage if not available from context
  useEffect(() => {
    if (!user) {
      try {
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser) {
          console.log("User loaded from localStorage:", localUser);
          setUser(localUser);
        }
      } catch (err) {
        console.error("Error loading user from localStorage:", err);
      }
    }
  }, [user]);
  
  const { 
    currentDiscussion, 
    comments,
    fetchDiscussionById, 
    fetchCommentsByDiscussion,
    toggleLikeDiscussion,
    toggleBookmarkDiscussion,
    togglePinDiscussion,
    createComment,
    deleteDiscussion,
    votePoll,
    loading, 
    error,
    totalComments,
    currentPage,
    totalPages
  } = useCommunity();
  
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [pollVote, setPollVote] = useState(-1);
  const [sortOption, setSortOption] = useState('newest');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pollError, setPollError] = useState('');
  const [clientSideVote, setClientSideVote] = useState(-1);
  
  const commentInputRef = useRef(null);
  
  useEffect(() => {
    if (discussionId) {
      fetchDiscussionById(discussionId);
      fetchCommentsByDiscussion(discussionId, 1, 20, sortOption);
    }
  }, [discussionId, fetchDiscussionById, fetchCommentsByDiscussion, sortOption]);
  
  // Check if user is the discussion creator
  const isCreator = () => {
    if (!user || !currentDiscussion) return false;
    return currentDiscussion.userId?._id === user._id;
  };
  
  // Check if user is a moderator or creator of the bowl
  const isModeratorOrCreator = () => {
    if (!user || !currentDiscussion || !currentDiscussion.bowlId) return false;
    
    const isCreator = currentDiscussion.bowlId.createdBy?.toString() === user._id;
    const isModerator = currentDiscussion.bowlId.moderators?.some(
      mod => mod.toString() === user._id
    );
    
    return isCreator || isModerator;
  };
  
  const handleLike = async () => {
    try {
      await toggleLikeDiscussion(discussionId);
    } catch (err) {
      console.error('Failed to like discussion:', err);
    }
  };
  
  const handleBookmark = async () => {
    try {
      await toggleBookmarkDiscussion(discussionId);
    } catch (err) {
      console.error('Failed to bookmark discussion:', err);
    }
  };
  
  const handlePin = async () => {
    if (!isModeratorOrCreator()) return;
    
    try {
      await togglePinDiscussion(discussionId);
    } catch (err) {
      console.error('Failed to pin discussion:', err);
    }
  };
  
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      await deleteDiscussion(discussionId);
      navigate(`/community/bowl/${currentDiscussion.bowlId._id}`);
    } catch (err) {
      console.error('Failed to delete discussion:', err);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteModal(false);
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    try {
      await createComment({
        discussionId,
        text: commentText
      });
      
      setCommentText('');
    } catch (err) {
      console.error('Failed to create comment:', err);
    }
  };
  
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || !replyingTo) return;
    
    try {
      await createComment({
        discussionId,
        parentId: replyingTo,
        text: replyText
      });
      
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to create reply:', err);
    }
  };
  
  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText('');
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };
  
  const handlePollVote = async (optionIndex) => {
    setPollError(''); // Clear any previous errors
    
    try {
      // Get current user vote
      const currentVotedOption = getUserVotedOption();
      
      // If user hasn't voted yet, use the backend API
      if (currentVotedOption === -1) {
        await votePoll(discussionId, optionIndex);
        console.log("New vote recorded via API");
        return;
      }
      
      // If user is selecting the same option they already voted for, do nothing
      if (currentVotedOption === optionIndex) {
        console.log("Already voted for this option");
        return;
      }
      
      // For vote changes, update the UI locally 
      if (currentVotedOption !== -1 && currentVotedOption !== optionIndex) {
        // Store this vote locally
        setClientSideVote(optionIndex);
        
        try {
          // Try to change vote via API (likely will fail)
          await votePoll(discussionId, optionIndex);
        } catch (err) {
          // Keep client-side UI updated even if the backend rejects the vote change
          console.log("Vote change not supported by backend, showing client-side UI change only");
          
          // Don't show error message since we're handling it gracefully
          if (err.response?.status === 400 && 
              err.response?.data?.message?.includes('already voted')) {
            // Silently fail - we're showing the UI change anyway
          } else {
            // For other errors, show the message
            setPollError("Backend error: " + (err.response?.data?.message || err.message));
          }
        }
      }
    } catch (err) {
      console.error('Failed to vote in poll:', err);
      setPollError("Error: " + (err.response?.data?.message || err.message));
    }
  };
  
  const handlePageChange = (page) => {
    fetchCommentsByDiscussion(discussionId, page, 20, sortOption);
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  
  // Calculate poll percentages and total votes
  const calculatePollStats = () => {
    if (!currentDiscussion || !currentDiscussion.poll) return { total: 0, percentages: [] };
    
    const total = currentDiscussion.poll.options.reduce(
      (sum, option) => sum + option.votes, 0
    );
    
    const percentages = currentDiscussion.poll.options.map(option => 
      total === 0 ? 0 : Math.round((option.votes / total) * 100)
    );
    
    return { total, percentages };
  };
  
  // Modified getUserVotedOption to respect client-side vote
  const getUserVotedOption = () => {
    // If we have a client-side vote, prioritize it
    if (clientSideVote !== -1) {
      return clientSideVote;
    }
    
    if (!user || !currentDiscussion || !currentDiscussion.poll) return -1;
    
    // Try to get userId from different possible locations
    const userId = user._id || user.id || (typeof user === 'string' ? user : null);
    
    if (!userId) {
      console.error("Cannot find user ID:", user);
      return -1;
    }
    
    // Original server-side vote detection
    for (let i = 0; i < currentDiscussion.poll.options.length; i++) {
      const option = currentDiscussion.poll.options[i];
      
      // Skip if no votedUsers array
      if (!option.votedUsers || !Array.isArray(option.votedUsers)) {
        continue;
      }
      
      // Check if userId is in votedUsers
      const hasVoted = option.votedUsers.some(votedId => {
        const stringMatch = String(votedId) === String(userId);
        return stringMatch;
      });
      
      if (hasVoted) {
        return i;
      }
    }
    
    return -1;
  };
  
  // Check if user has voted in the poll
  const hasVoted = () => {
    if (!user || !currentDiscussion || !currentDiscussion.poll) return false;
    
    // Try to get userId from different possible locations
    const userId = user._id || user.id || (typeof user === 'string' ? user : null);
    
    if (!userId) {
      console.error("Cannot find user ID in hasVoted:", user);
      return false;
    }
    
    // Check each option's votedUsers array
    return currentDiscussion.poll.options.some(option => {
      if (!option.votedUsers || !Array.isArray(option.votedUsers)) {
        return false;
      }
      
      // Try both string and direct comparisons
      return option.votedUsers.some(votedId => String(votedId) === String(userId));
    });
  };
  
  // Check if a user token exists (logged in)
  const hasToken = () => {
    return !!localStorage.getItem('token');
  };
  
  // For debugging
  console.log("User state:", { 
    contextUser: auth.user,
    localUser: user, 
    hasToken: hasToken(),
    isUserLoaded: !!user
  });
  
  console.log("Poll voting state:", { 
    hasVoted: hasVoted(),
    votedOptionIndex: getUserVotedOption(),
    pollOptions: currentDiscussion?.poll?.options,
    userId: user?._id
  });
  
  if (loading && !currentDiscussion) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-md">
        {error}
      </div>
    );
  }
  
  if (!currentDiscussion) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Discussion not found</h3>
        <Link to="/community" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Community
        </Link>
      </div>
    );
  }
  
  const { percentages, total } = calculatePollStats();
  const userHasVoted = hasVoted() || clientSideVote !== -1;
  const userVotedOption = getUserVotedOption();
  const isLoggedIn = !!user || hasToken();
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          to={`/community/bowl/${currentDiscussion.bowlId._id}`} 
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Back to Bowl
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        {/* Discussion Header */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-start mb-4">
            <div>
              <div className="flex items-center mb-2">
                {currentDiscussion.isPinned && (
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded flex items-center mr-2">
                    <FaThumbtack className="mr-1" size={10} /> Pinned
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{currentDiscussion.title}</h1>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {currentDiscussion.tags && currentDiscussion.tags.map((tag, index) => (
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
                  {currentDiscussion.userId?.avatar ? (
                    <img
                      src={currentDiscussion.userId.avatar}
                      alt={currentDiscussion.userId.name || 'User'}
                      className="w-6 h-6 rounded-full mr-1"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full mr-1 flex items-center justify-center text-white text-xs">
                      {(currentDiscussion.userId?.name || 'U').charAt(0)}
                    </div>
                  )}
                  <span>{currentDiscussion.userId?.name || 'Anonymous'}</span>
                </div>
                
                <div className="flex items-center">
                  <FaRegClock className="mr-1" />
                  {currentDiscussion.createdAt && 
                    formatDistanceToNow(new Date(currentDiscussion.createdAt), { addSuffix: true })}
                  
                  {currentDiscussion.updatedAt && 
                   currentDiscussion.updatedAt !== currentDiscussion.createdAt && (
                    <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
                      (Edited {formatDistanceToNow(new Date(currentDiscussion.updatedAt), { addSuffix: true })})
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex mt-2 md:mt-0">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                  currentDiscussion.isLiked ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                }`}
                title={currentDiscussion.isLiked ? 'Unlike' : 'Like'}
              >
                <FaThumbsUp className="mr-1" />
                <span>{currentDiscussion.likes || 0}</span>
              </button>
              
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentDiscussion.isBookmarked ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'
                }`}
                title={currentDiscussion.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                <FaBookmark />
              </button>
              
              {isModeratorOrCreator() && (
                <button
                  onClick={handlePin}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    currentDiscussion.isPinned ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`}
                  title={currentDiscussion.isPinned ? 'Unpin' : 'Pin'}
                >
                  <FaThumbtack />
                </button>
              )}
              
              {isCreator() && (
                <>
                  <Link
                    to={`/community/discussion/${discussionId}/edit`}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"
                    title="Edit"
                  >
                    <FaEdit />
                  </Link>
                  
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Discussion Content */}
          <div className="prose dark:prose-invert max-w-none my-6">
            <ReactMarkdown>{currentDiscussion.body}</ReactMarkdown>
          </div>
          
          {/* Poll Section */}
          {currentDiscussion.poll && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 my-6 bg-gray-50 dark:bg-gray-900/30">
              <div className="flex items-center mb-4">
                <FaPoll className="text-blue-500 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{currentDiscussion.poll.question}</h3>
              </div>
              
              <div className="space-y-3">
                {currentDiscussion.poll.options.map((option, index) => {
                  const isUserVotedForThis = userVotedOption === index;
                  return (
                  <div key={index} className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <label 
                        className={`flex items-center w-full cursor-pointer ${!isLoggedIn ? 'opacity-75' : ''} ${isUserVotedForThis ? 'font-semibold' : ''}`}
                        title={!isLoggedIn ? 'Login to vote' : ''}
                      >
                        <input
                          type="radio"
                          name="poll-option"
                          checked={isUserVotedForThis}
                          onChange={() => isLoggedIn && handlePollVote(index)}
                          className="form-radio h-4 w-4 text-blue-600 dark:border-gray-600"
                          disabled={!isLoggedIn || !currentDiscussion.poll.isActive}
                        />
                        <span className={`ml-2 ${isUserVotedForThis ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{option.text}</span>
                        
                        {/* Show results regardless of whether user has voted */}
                        <div className="flex-grow ml-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">{option.votes} votes ({percentages[index]}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${isUserVotedForThis ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-500'}`}
                              style={{ width: `${percentages[index]}%` }}
                            ></div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )})}
              </div>
              
              <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
                {pollError && (
                  <div className="text-red-500 dark:text-red-400 mb-2 font-medium">
                    {pollError}
                  </div>
                )}
                
                Total votes: {total} | 
                {currentDiscussion.poll.isActive ? (
                  <span className="text-green-500 dark:text-green-400 ml-1">Poll is active</span>
                ) : (
                  <span className="text-red-500 dark:text-red-400 ml-1">Poll is closed</span>
                )}
                
                {userHasVoted && currentDiscussion.poll.isActive && (
                  <span className="ml-3">
                    You voted for "{currentDiscussion.poll.options[userVotedOption]?.text}".
                    <span className="text-blue-500 dark:text-blue-400"> You can change your vote.</span>
                  </span>
                )}
                
                {!isLoggedIn && (
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    You need to be logged in to vote
                  </p>
                )}
                
                {clientSideVote !== -1 && (
                  <div className="mt-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded p-2 text-xs">
                    <strong>Note:</strong> Your vote change is displayed here but might not be saved permanently 
                    since the server doesn't support changing votes.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Comments Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Comments ({totalComments})</h2>
            
            <select
              value={sortOption}
              onChange={handleSortChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
          
          {/* Comment Form */}
          {isLoggedIn && (
            <div className="mb-8">
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-4">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FaRegComment className="mr-2" />
                    Comment
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Comments List */}
          {loading && !comments.length ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : comments.length > 0 ? (
            <>
              <div className="space-y-6">
                {comments.map(comment => (
                  <Comment
                    key={comment._id}
                    comment={comment}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    startReply={startReply}
                    cancelReply={cancelReply}
                    setReplyText={setReplyText}
                    handleReplySubmit={handleReplySubmit}
                    currentUser={user}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Delete Discussion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this discussion? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Comment = ({ 
  comment, 
  replyingTo, 
  replyText, 
  startReply, 
  cancelReply, 
  setReplyText, 
  handleReplySubmit,
  currentUser
}) => {
  const { toggleLikeComment, deleteComment } = useCommunity();
  const [showReplies, setShowReplies] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Try to get user from localStorage if not provided
  const [user, setUser] = useState(currentUser);
  
  useEffect(() => {
    if (!user) {
      try {
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser) {
          setUser(localUser);
        }
      } catch (err) {
        console.error("Error loading user in Comment component:", err);
      }
    }
  }, [user]);
  
  const handleLike = async () => {
    try {
      await toggleLikeComment(comment._id);
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };
  
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      await deleteComment(comment._id);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteModal(false);
  };
  
  const isCreator = () => {
    if (!user) return false;
    return comment.userId?._id === user._id;
  };
  
  return (
    <div className="relative">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex justify-between">
          <div className="flex items-center mb-2">
            {comment.userId?.avatar ? (
              <img
                src={comment.userId.avatar}
                alt={comment.userId.name || 'User'}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full mr-2 flex items-center justify-center text-white text-xs">
                {(comment.userId?.name || 'U').charAt(0)}
              </div>
            )}
            <span className="font-medium text-gray-800 dark:text-white">{comment.userId?.name || 'Anonymous'}</span>
            <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <span className="ml-1 text-gray-400 dark:text-gray-500 text-xs">
                  (Edited)
                </span>
              )}
            </span>
          </div>
          
          <div className="flex">
            <button
              onClick={handleLike}
              className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                comment.isLiked ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <FaThumbsUp className="mr-1" size={14} />
              <span className="text-sm">{comment.likes || 0}</span>
            </button>
            
            {isCreator() && (
              <button
                onClick={handleDelete}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 ml-1"
                title="Delete"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line">
          {comment.text}
        </div>
        
        {user && !comment.parentId && (
          <button
            onClick={() => startReply(comment._id)}
            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <FaReply className="mr-1" size={12} />
            Reply
          </button>
        )}
      </div>
      
      {/* Reply Form */}
      {replyingTo === comment._id && (
        <div className="mt-2 ml-8">
          <form onSubmit={handleReplySubmit}>
            <div className="mb-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows="2"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelReply}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 ml-8 space-y-3">
          <div className="flex items-center">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          </div>
          
          {showReplies && (
            <>
              {comment.replies.map(reply => (
                <div key={reply._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between">
                    <div className="flex items-center mb-2">
                      {reply.userId?.avatar ? (
                        <img
                          src={reply.userId.avatar}
                          alt={reply.userId.name || 'User'}
                          className="w-5 h-5 rounded-full mr-1"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-blue-500 dark:bg-blue-600 rounded-full mr-1 flex items-center justify-center text-white text-xs">
                          {(reply.userId?.name || 'U').charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-sm text-gray-800 dark:text-white">{reply.userId?.name || 'Anonymous'}</span>
                      <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {reply.createdAt && formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        
                        {reply.updatedAt && reply.updatedAt !== reply.createdAt && (
                          <span className="ml-1 text-gray-400 dark:text-gray-500 text-xs">
                            (Edited)
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex">
                      <button
                        onClick={() => toggleLikeComment(reply._id)}
                        className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                          reply.isLiked ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        <FaThumbsUp className="mr-1" size={12} />
                        <span className="text-xs">{reply.likes || 0}</span>
                      </button>
                      
                      {user && reply.userId?._id === user._id && (
                        <button
                          onClick={() => deleteComment(reply._id)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 ml-1"
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                    {reply.text}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Delete Comment</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionDetail; 