import api from '../services/api';

// Bowl API functions
export const fetchBowls = async (params = {}) => {
  try {
    const { data } = await api.get('/api/community/bowls', { params });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchBowlById = async (id) => {
  try {
    const { data } = await api.get(`/api/community/bowls/${id}`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createBowl = async (bowlData) => {
  try {
    const { data } = await api.post('/api/community/bowls', bowlData);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBowl = async (id, bowlData) => {
  try {
    const { data } = await api.put(`/api/community/bowls/${id}`, bowlData);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBowl = async (id) => {
  try {
    const { data } = await api.delete(`/api/community/bowls/${id}`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Discussion API functions
export const fetchDiscussionsByBowl = async (bowlId, params = {}) => {
  try {
    const { data } = await api.get(`/api/community/bowls/${bowlId}/discussions`, { params });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchDiscussionById = async (id) => {
  try {
    const { data } = await api.get(`/api/community/discussions/${id}`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createDiscussion = async (discussionData) => {
  try {
    const { data } = await api.post('/api/community/discussions', discussionData);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateDiscussion = async (id, discussionData) => {
  try {
    const { data } = await api.put(`/api/community/discussions/${id}`, discussionData);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteDiscussion = async (id) => {
  try {
    const { data } = await api.delete(`/api/community/discussions/${id}`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleLikeDiscussion = async (id) => {
  try {
    const { data } = await api.post(`/api/community/discussions/${id}/like`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleBookmarkDiscussion = async (id) => {
  try {
    const { data } = await api.post(`/api/community/discussions/${id}/bookmark`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const togglePinDiscussion = async (id, bowlId) => {
  try {
    const { data } = await api.post(`/api/community/discussions/${id}/pin`, { bowlId });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Poll voting
export const votePoll = async (discussionId, optionId) => {
  try {
    const { data } = await api.post(`/api/community/discussions/${discussionId}/vote`, { optionId });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Comment API functions
export const fetchCommentsByDiscussion = async (discussionId, params = {}) => {
  try {
    const { data } = await api.get(`/api/community/discussions/${discussionId}/comments`, { params });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createComment = async (commentData) => {
  try {
    const { data } = await api.post('/api/community/comments', commentData);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateComment = async (id, commentData) => {
  try {
    const { data } = await api.put(`/api/community/comments/${id}`, commentData);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteComment = async (id) => {
  try {
    const { data } = await api.delete(`/api/community/comments/${id}`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleLikeComment = async (id) => {
  try {
    const { data } = await api.post(`/api/community/comments/${id}/like`);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
}; 