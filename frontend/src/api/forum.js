import API from "./axios";

// --- Subs ---
// Fetch all subs
export const fetchSubs = async () => {
  const res = await API.get("/forum/subs");
  return res.data;
};

// Fetch single sub by ID
export const fetchSubById = async (id) => {
  const res = await API.get(`/forum/subs/${id}`);
  return res.data;
};

// --- Posts ---
// Fetch posts in a sub
export const fetchPostsInSub = async (subId) => {
  const res = await API.get(`/forum/subs/${subId}/posts`);
  return res.data;
};

// Fetch single post by ID (auth optional)
export const fetchPostById = async (id) => {
  const res = await API.get(`/forum/posts/${id}`);
  return res.data;
};

// Vote on a post (auth required)
export const votePost = async (postId, voteType, token) => {
  const res = await API.post(`/forum/posts/${postId}/vote`, { vote: voteType }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Create new sub (auth + PT/Admin)
export const createSub = async (data, token) => {
  const res = await API.post("/forum/subs", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Create new post (auth required)
export const createPost = async (data, token) => {
  const res = await API.post("/forum/posts", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// --- Comments ---
// Fetch all comments for a post (public)
export const fetchComments = async (postId) => {
  const res = await API.get(`/forum/posts/${postId}/comments`);
  return res.data;
};

// Add a comment to a post (auth required)
export const addComment = async (postId, content, token) => {
  const res = await API.post(`/forum/posts/${postId}/comments`, { content }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Delete a comment by ID (auth required, owner or admin)
export const deleteComment = async (commentId, token) => {
  const res = await API.delete(`/forum/comments/${commentId}`,{
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};