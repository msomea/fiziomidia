import API from "./axios";
import { API_URL } from "../config/constants";

// --- Subs ---
// Fetch all subs
export const fetchSubs = async () => {
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
export const votePost = async (postId, voteType, token) => {
  const res = await API.post(`${API_URL}/forum/posts/${postId}/vote`, { vote: voteType }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Create new sub (auth + PT/Admin)
export const createSub = async (data, token) => {
  const res = await API.post(`${API_URL}/forum/subs`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Create new post (auth required)
export const createPost = async (data, token) => {
  const res = await API.post(`${API_URL}/forum/posts`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// --- Comments ---
// Fetch all comments for a post (public)
export const fetchComments = async (postId) => {
  const res = await API.get(`${API_URL}/forum/posts/${postId}/comments`);
  return res.data;
};

// Add a comment to a post (auth required)
export const addComment = async (postId, content, token) => {
  const res = await API.post(`${API_URL}/forum/posts/${postId}/comments`, { content }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Delete a comment by ID (auth required, owner or admin)
export const deleteComment = async (commentId, token) => {
  const res = await API.delete(`${API_URL}/forum/comments/${commentId}`,{
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};