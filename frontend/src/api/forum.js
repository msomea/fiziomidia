import API from "./axios";
import { API_URL } from "../config/constants";

// --- Subs ---
// Fetch all subs
export const fetchForumSubs = async () => {
  const res = await API.get(`${API_URL}/forum/subs`);
  return res.data;
};

// Fetch single sub by ID
export const fetchSubById = async (id) => {
  const res = await API.get(`${API_URL}/forum/subs/${id}`);
  return res.data;
};

// --- Posts ---
// Fetch posts in a sub
export const fetchPostsInSub = async (subId) => {
  const res = await API.get(`${API_URL}/forum/subs/${subId}/posts`);
  return res.data;
};

// Fetch single post by ID (auth optional)
export const fetchPostById = async (id) => {
  const res = await API.get(`${API_URL}/forum/posts/${id}`);
  return res.data;
};

// Vote on a post (auth required)
export const votePost = async (postId, voteType) => {
  const res = await API.post(`${API_URL}/forum/posts/${postId}/vote`, {
    vote: voteType,
  });
  return res.data;
};

// Create new sub (auth + PT/Admin)
export const createSub = async (data) => {
  const res = await API.post(`${API_URL}/forum/subs`, data);
  return res.data;
};

// Create new post (auth required)
export const createPost = async (data) => {
  const res = await API.post(`${API_URL}/forum/posts`, data);
  return res.data;
};

// --- Comments ---
// Fetch all comments for a post (public)
export const fetchComments = async (postId) => {
  const res = await API.get(`${API_URL}/forum/posts/${postId}/comments`);
  return res.data;
};

// Add a comment to a post (auth required)
export const addComment = async (postId, content) => {
  const res = await API.post(`${API_URL}/forum/posts/${postId}/comments`, {
    content,
  });
  return res.data;
};

// Delete a comment by ID (auth required, owner or admin)
export const deleteComment = async (commentId) => {
  const res = await API.delete(`${API_URL}/forum/comments/${commentId}`);
  return res.data;
};

// --- Additional Forum Operations ---
// Fetch forum subs with pagination and search
export const fetchForumSubsPaginated = async (page = 1, limit = 10, search = "") => {
  const res = await API.get(`${API_URL}/forum/subs?page=${page}&limit=${limit}&search=${search}`);
  return res.data;
};

// Update post by ID
export const updatePost = async (postId, data) => {
  const res = await API.put(`${API_URL}/forum/posts/${postId}`, data);
  return res.data;
};

// Update sub by ID
export const updateSub = async (subId, data) => {
  const res = await API.put(`${API_URL}/forum/subs/${subId}`, data);
  return res.data;
};

// Pin/unpin post
export const togglePostPin = async (postId, pinned) => {
  const res = await API.put(`${API_URL}/forum/posts/${postId}/pin`, { pinned });
  return res.data;
};

// Get moderator request status for a sub
export const getModRequestStatus = async (subId) => {
  const res = await API.get(`${API_URL}/forum/subs/${subId}/my-mod-request`);
  return res.data;
};

// Request moderator status for a sub
export const requestModeratorStatus = async (subId) => {
  const res = await API.post(`${API_URL}/forum/subs/${subId}/mod-requests`);
  return res.data;
};

// Delete a post by ID (auth required, owner or admin)
export const deletePost = async (postId) => {
  const res = await API.delete(`${API_URL}/forum/posts/${postId}`);
  return res.data;
};

// Update a comment by ID (auth required, owner or admin)
export const updateComment = async (postId, commentId, content) => {
  const res = await API.put(`${API_URL}/forum/posts/${postId}/comments/${commentId}`, {
    content,
  });
  return res.data;
};

// Delete a comment by ID (auth required, owner or admin)
export const deleteCommentFromPost = async (postId, commentId) => {
  const res = await API.delete(`${API_URL}/forum/posts/${postId}/comments/${commentId}`);
  return res.data;
};

// Add reply to a comment (auth required)
export const addReplyToComment = async (postId, content, parentCommentId) => {
  const res = await API.post(`${API_URL}/forum/posts/${postId}/comments`, {
    content,
    parentComment: parentCommentId,
  });
  return res.data;
};