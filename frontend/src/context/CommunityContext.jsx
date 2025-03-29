import { createContext, useContext, useState, useReducer, useCallback } from 'react';
import axios from 'axios';

const CommunityContext = createContext();

// Initial state for community
const initialState = {
  bowls: [],
  currentBowl: null,
  discussions: [],
  currentDiscussion: null,
  comments: [],
  loading: false,
  error: null,
  totalBowls: 0,
  totalDiscussions: 0,
  totalComments: 0,
  currentPage: 1,
  totalPages: 1
};

// Reducer for community actions
function communityReducer(state, action) {
  switch (action.type) {
    case 'FETCH_BOWLS_REQUEST':
    case 'FETCH_BOWL_REQUEST':
    case 'FETCH_DISCUSSIONS_REQUEST':
    case 'FETCH_DISCUSSION_REQUEST':
    case 'FETCH_COMMENTS_REQUEST':
    case 'CREATE_BOWL_REQUEST':
    case 'CREATE_DISCUSSION_REQUEST':
    case 'CREATE_COMMENT_REQUEST':
      return { ...state, loading: true, error: null };

    case 'FETCH_BOWLS_SUCCESS':
      return {
        ...state,
        bowls: action.payload.data,
        totalBowls: action.payload.total,
        currentPage: action.payload.page,
        totalPages: action.payload.pages,
        loading: false,
        error: null
      };

    case 'FETCH_BOWL_SUCCESS':
      return {
        ...state,
        currentBowl: action.payload.data,
        loading: false,
        error: null
      };

    case 'FETCH_DISCUSSIONS_SUCCESS':
      return {
        ...state,
        discussions: action.payload.data,
        totalDiscussions: action.payload.total,
        currentPage: action.payload.page,
        totalPages: action.payload.pages,
        loading: false,
        error: null
      };

    case 'FETCH_DISCUSSION_SUCCESS':
      return {
        ...state,
        currentDiscussion: action.payload.data,
        loading: false,
        error: null
      };

    case 'FETCH_COMMENTS_SUCCESS':
      return {
        ...state,
        comments: action.payload.data,
        totalComments: action.payload.total,
        currentPage: action.payload.page,
        totalPages: action.payload.pages,
        loading: false,
        error: null
      };

    case 'CREATE_BOWL_SUCCESS':
      return {
        ...state,
        bowls: [action.payload.data, ...state.bowls],
        loading: false,
        error: null
      };

    case 'CREATE_DISCUSSION_SUCCESS':
      return {
        ...state,
        discussions: [action.payload.data, ...state.discussions],
        loading: false,
        error: null
      };

    case 'CREATE_COMMENT_SUCCESS':
      // If it's a reply to a comment
      if (action.payload.data.parentId) {
        return {
          ...state,
          comments: state.comments.map(comment => 
            comment._id === action.payload.data.parentId 
              ? { ...comment, replies: [...(comment.replies || []), action.payload.data] }
              : comment
          ),
          loading: false,
          error: null
        };
      }
      // If it's a top-level comment
      return {
        ...state,
        comments: [action.payload.data, ...state.comments],
        loading: false,
        error: null
      };

    case 'UPDATE_BOWL_SUCCESS':
      return {
        ...state,
        bowls: state.bowls.map(bowl => 
          bowl._id === action.payload.data._id ? action.payload.data : bowl
        ),
        currentBowl: state.currentBowl?._id === action.payload.data._id 
          ? action.payload.data 
          : state.currentBowl,
        loading: false,
        error: null
      };

    case 'UPDATE_DISCUSSION_SUCCESS':
      return {
        ...state,
        discussions: state.discussions.map(discussion => 
          discussion._id === action.payload.data._id ? action.payload.data : discussion
        ),
        currentDiscussion: state.currentDiscussion?._id === action.payload.data._id 
          ? action.payload.data 
          : state.currentDiscussion,
        loading: false,
        error: null
      };

    case 'UPDATE_COMMENT_SUCCESS':
      return {
        ...state,
        comments: state.comments.map(comment => {
          if (comment._id === action.payload.data._id) {
            return action.payload.data;
          }
          // Check in replies
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply._id === action.payload.data._id ? action.payload.data : reply
              )
            };
          }
          return comment;
        }),
        loading: false,
        error: null
      };

    case 'DELETE_BOWL_SUCCESS':
      return {
        ...state,
        bowls: state.bowls.filter(bowl => bowl._id !== action.payload.id),
        currentBowl: state.currentBowl?._id === action.payload.id ? null : state.currentBowl,
        loading: false,
        error: null
      };

    case 'DELETE_DISCUSSION_SUCCESS':
      return {
        ...state,
        discussions: state.discussions.filter(discussion => discussion._id !== action.payload.id),
        currentDiscussion: state.currentDiscussion?._id === action.payload.id ? null : state.currentDiscussion,
        loading: false,
        error: null
      };

    case 'DELETE_COMMENT_SUCCESS':
      return {
        ...state,
        comments: state.comments.filter(comment => {
          // Remove the comment if it matches
          if (comment._id === action.payload.id) {
            return false;
          }
          // Check in replies and filter if needed
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply._id !== action.payload.id)
            };
          }
          return true;
        }),
        loading: false,
        error: null
      };

    case 'LIKE_DISCUSSION_SUCCESS':
      return {
        ...state,
        discussions: state.discussions.map(discussion => 
          discussion._id === action.payload.id 
            ? { 
                ...discussion, 
                likes: action.payload.likes,
                isLiked: action.payload.liked
              } 
            : discussion
        ),
        currentDiscussion: state.currentDiscussion?._id === action.payload.id 
          ? { 
              ...state.currentDiscussion, 
              likes: action.payload.likes,
              isLiked: action.payload.liked
            } 
          : state.currentDiscussion,
        loading: false,
        error: null
      };

    case 'BOOKMARK_DISCUSSION_SUCCESS':
      return {
        ...state,
        discussions: state.discussions.map(discussion => 
          discussion._id === action.payload.id 
            ? { 
                ...discussion, 
                isBookmarked: action.payload.bookmarked
              } 
            : discussion
        ),
        currentDiscussion: state.currentDiscussion?._id === action.payload.id 
          ? { 
              ...state.currentDiscussion, 
              isBookmarked: action.payload.bookmarked
            } 
          : state.currentDiscussion,
        loading: false,
        error: null
      };

    case 'PIN_DISCUSSION_SUCCESS':
      return {
        ...state,
        discussions: state.discussions.map(discussion => 
          discussion._id === action.payload.id 
            ? { 
                ...discussion, 
                isPinned: action.payload.isPinned
              } 
            : discussion
        ),
        currentDiscussion: state.currentDiscussion?._id === action.payload.id 
          ? { 
              ...state.currentDiscussion, 
              isPinned: action.payload.isPinned
            } 
          : state.currentDiscussion,
        loading: false,
        error: null
      };

    case 'LIKE_COMMENT_SUCCESS':
      return {
        ...state,
        comments: state.comments.map(comment => {
          // Update the comment if it matches
          if (comment._id === action.payload.id) {
            return { 
              ...comment, 
              likes: action.payload.likes,
              isLiked: action.payload.liked
            };
          }
          // Check in replies for matches
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply._id === action.payload.id 
                  ? { 
                      ...reply, 
                      likes: action.payload.likes,
                      isLiked: action.payload.liked
                    } 
                  : reply
              )
            };
          }
          return comment;
        }),
        loading: false,
        error: null
      };

    case 'VOTE_POLL_SUCCESS':
      return {
        ...state,
        currentDiscussion: state.currentDiscussion?._id === action.payload.discussionId 
          ? { 
              ...state.currentDiscussion, 
              poll: action.payload.poll
            } 
          : state.currentDiscussion,
        loading: false,
        error: null
      };

    case 'FETCH_BOWLS_FAILURE':
    case 'FETCH_BOWL_FAILURE':
    case 'FETCH_DISCUSSIONS_FAILURE':
    case 'FETCH_DISCUSSION_FAILURE':
    case 'FETCH_COMMENTS_FAILURE':
    case 'CREATE_BOWL_FAILURE':
    case 'CREATE_DISCUSSION_FAILURE':
    case 'CREATE_COMMENT_FAILURE':
    case 'UPDATE_BOWL_FAILURE':
    case 'UPDATE_DISCUSSION_FAILURE':
    case 'UPDATE_COMMENT_FAILURE':
    case 'DELETE_BOWL_FAILURE':
    case 'DELETE_DISCUSSION_FAILURE':
    case 'DELETE_COMMENT_FAILURE':
    case 'LIKE_DISCUSSION_FAILURE':
    case 'BOOKMARK_DISCUSSION_FAILURE':
    case 'PIN_DISCUSSION_FAILURE':
    case 'LIKE_COMMENT_FAILURE':
    case 'VOTE_POLL_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET_COMMUNITY':
      return initialState;

    default:
      return state;
  }
}

export function CommunityProvider({ children }) {
  const [state, dispatch] = useReducer(communityReducer, initialState);

  // Create API instance with interceptor to add auth token from localStorage
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Log the base URL for debugging
  console.log("API Base URL:", api.defaults.baseURL);

  // Add token to requests directly from localStorage
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("API request with token:", config.url);
      } else {
        console.log("API request without token:", config.url);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Bowls
  const fetchBowls = useCallback(async (page = 1, limit = 10, tags = '', search = '') => {
    dispatch({ type: 'FETCH_BOWLS_REQUEST' });
    try {
      const response = await api.get(
        `/api/community/bowls?page=${page}&limit=${limit}&tags=${tags}&search=${search}`
      );
      dispatch({
        type: 'FETCH_BOWLS_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'FETCH_BOWLS_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const fetchBowlById = useCallback(async (id) => {
    dispatch({ type: 'FETCH_BOWL_REQUEST' });
    try {
      const response = await api.get(`/api/community/bowls/${id}`);
      dispatch({
        type: 'FETCH_BOWL_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'FETCH_BOWL_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const createBowl = useCallback(async (bowlData) => {
    dispatch({ type: 'CREATE_BOWL_REQUEST' });
    try {
      const response = await api.post('/api/community/bowls', bowlData);
      dispatch({
        type: 'CREATE_BOWL_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'CREATE_BOWL_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const updateBowl = useCallback(async (id, bowlData) => {
    dispatch({ type: 'UPDATE_BOWL_REQUEST' });
    try {
      const response = await api.put(`/api/community/bowls/${id}`, bowlData);
      dispatch({
        type: 'UPDATE_BOWL_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'UPDATE_BOWL_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const deleteBowl = useCallback(async (id) => {
    dispatch({ type: 'DELETE_BOWL_REQUEST' });
    try {
      await api.delete(`/api/community/bowls/${id}`);
      dispatch({
        type: 'DELETE_BOWL_SUCCESS',
        payload: { id }
      });
    } catch (error) {
      dispatch({
        type: 'DELETE_BOWL_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const manageModerator = useCallback(async (bowlId, userId, action) => {
    try {
      const response = await api.post(`/api/community/bowls/${bowlId}/moderator`, {
        userId,
        action // 'add' or 'remove'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  // Discussions
  const fetchDiscussionsByBowl = useCallback(async (bowlId, page = 1, limit = 10, sort = 'newest') => {
    dispatch({ type: 'FETCH_DISCUSSIONS_REQUEST' });
    try {
      const token = localStorage.getItem('token');
      console.log("Using token:", token ? `${token.substring(0, 10)}...` : 'No token found');
      
      const response = await api.get(
        `/api/community/bowls/${bowlId}/discussions?page=${page}&limit=${limit}&sort=${sort}`
      );
      console.log("Discussions API response:", response);
      
      dispatch({
        type: 'FETCH_DISCUSSIONS_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      console.error("Discussions API error:", error);
      // If token expired or missing, add helpful message
      const errorMsg = error.response?.status === 401 ? 
        "Authentication error - please log in again" : 
        error.response?.data?.message || error.message;
        
      dispatch({
        type: 'FETCH_DISCUSSIONS_FAILURE',
        payload: errorMsg
      });
      throw error;
    }
  }, []);

  const fetchDiscussionById = useCallback(async (id) => {
    dispatch({ type: 'FETCH_DISCUSSION_REQUEST' });
    try {
      const response = await api.get(`/api/community/discussions/${id}`);
      dispatch({
        type: 'FETCH_DISCUSSION_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'FETCH_DISCUSSION_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const createDiscussion = useCallback(async (discussionData) => {
    dispatch({ type: 'CREATE_DISCUSSION_REQUEST' });
    try {
      console.log('Creating discussion with data:', discussionData);
      
      // Verify if the token exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Debug the API URL
      console.log('Posting to URL:', `${api.defaults.baseURL}/api/community/discussions`);
      
      const response = await api.post('/api/community/discussions', discussionData);
      console.log('Discussion creation response:', response);
      
      dispatch({
        type: 'CREATE_DISCUSSION_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      console.error('Discussion creation error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to create discussion';
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid discussion data';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create a discussion in this bowl.';
      }
      
      dispatch({
        type: 'CREATE_DISCUSSION_FAILURE',
        payload: errorMessage
      });
      throw error;
    }
  }, []);

  const updateDiscussion = useCallback(async (id, discussionData) => {
    dispatch({ type: 'UPDATE_DISCUSSION_REQUEST' });
    try {
      const response = await api.put(`/api/community/discussions/${id}`, discussionData);
      dispatch({
        type: 'UPDATE_DISCUSSION_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'UPDATE_DISCUSSION_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const deleteDiscussion = useCallback(async (id) => {
    dispatch({ type: 'DELETE_DISCUSSION_REQUEST' });
    try {
      await api.delete(`/api/community/discussions/${id}`);
      dispatch({
        type: 'DELETE_DISCUSSION_SUCCESS',
        payload: { id }
      });
    } catch (error) {
      dispatch({
        type: 'DELETE_DISCUSSION_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const toggleLikeDiscussion = useCallback(async (id) => {
    try {
      const response = await api.post(`/api/community/discussions/${id}/like`);
      dispatch({
        type: 'LIKE_DISCUSSION_SUCCESS',
        payload: {
          id,
          likes: response.data.likes,
          liked: response.data.liked
        }
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'LIKE_DISCUSSION_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const toggleBookmarkDiscussion = useCallback(async (id) => {
    try {
      const response = await api.post(`/api/community/discussions/${id}/bookmark`);
      dispatch({
        type: 'BOOKMARK_DISCUSSION_SUCCESS',
        payload: {
          id,
          bookmarked: response.data.bookmarked
        }
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'BOOKMARK_DISCUSSION_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const togglePinDiscussion = useCallback(async (id) => {
    try {
      const response = await api.post(`/api/community/discussions/${id}/pin`);
      dispatch({
        type: 'PIN_DISCUSSION_SUCCESS',
        payload: {
          id,
          isPinned: response.data.isPinned
        }
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'PIN_DISCUSSION_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const votePoll = useCallback(async (discussionId, optionIndex) => {
    try {
      const response = await api.post(`/api/community/discussions/${discussionId}/vote`, {
        optionIndex
      });
      dispatch({
        type: 'VOTE_POLL_SUCCESS',
        payload: {
          discussionId,
          poll: response.data.data
        }
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'VOTE_POLL_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  // Comments
  const fetchCommentsByDiscussion = useCallback(async (discussionId, page = 1, limit = 20, sort = 'newest') => {
    dispatch({ type: 'FETCH_COMMENTS_REQUEST' });
    try {
      const response = await api.get(
        `/api/community/discussions/${discussionId}/comments?page=${page}&limit=${limit}&sort=${sort}`
      );
      dispatch({
        type: 'FETCH_COMMENTS_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'FETCH_COMMENTS_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const fetchCommentById = useCallback(async (id) => {
    try {
      const response = await api.get(`/api/community/comments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const createComment = useCallback(async (commentData) => {
    dispatch({ type: 'CREATE_COMMENT_REQUEST' });
    try {
      const response = await api.post('/api/community/comments', commentData);
      dispatch({
        type: 'CREATE_COMMENT_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'CREATE_COMMENT_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const updateComment = useCallback(async (id, text) => {
    dispatch({ type: 'UPDATE_COMMENT_REQUEST' });
    try {
      const response = await api.put(`/api/community/comments/${id}`, { text });
      dispatch({
        type: 'UPDATE_COMMENT_SUCCESS',
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'UPDATE_COMMENT_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const deleteComment = useCallback(async (id) => {
    dispatch({ type: 'DELETE_COMMENT_REQUEST' });
    try {
      await api.delete(`/api/community/comments/${id}`);
      dispatch({
        type: 'DELETE_COMMENT_SUCCESS',
        payload: { id }
      });
    } catch (error) {
      dispatch({
        type: 'DELETE_COMMENT_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const toggleLikeComment = useCallback(async (id) => {
    try {
      const response = await api.post(`/api/community/comments/${id}/like`);
      dispatch({
        type: 'LIKE_COMMENT_SUCCESS',
        payload: {
          id,
          likes: response.data.likes,
          liked: response.data.liked
        }
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: 'LIKE_COMMENT_FAILURE',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const resetCommunity = useCallback(() => {
    dispatch({ type: 'RESET_COMMUNITY' });
  }, []);

  // Get current user from localStorage
  const getCurrentUser = useCallback(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    }
    return null;
  }, []);

  return (
    <CommunityContext.Provider
      value={{
        ...state,
        fetchBowls,
        fetchBowlById,
        createBowl,
        updateBowl,
        deleteBowl,
        manageModerator,
        fetchDiscussionsByBowl,
        fetchDiscussionById,
        createDiscussion,
        updateDiscussion,
        deleteDiscussion,
        toggleLikeDiscussion,
        toggleBookmarkDiscussion,
        togglePinDiscussion,
        votePoll,
        fetchCommentsByDiscussion,
        fetchCommentById,
        createComment,
        updateComment,
        deleteComment,
        toggleLikeComment,
        clearError,
        resetCommunity,
        getCurrentUser
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  return useContext(CommunityContext);
} 