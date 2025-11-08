
import React, { createContext, useContext, useState } from "react";
import API from "../api/axios";
import { toast } from "react-hot-toast";

const ForumContext = createContext();

export const ForumProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Fetch posts for a sub
  const fetchPosts = async (subId) => {
    if (!subId) return;
    try {
      setLoadingPosts(true);
      const res = await API.get(`/forum/subs/${subId}/posts?page=1&limit=10`);
      setPosts(res.data.posts || []);
      setSelectedSub(subId);
    } catch (err) {
      console.error("Error fetching posts:", err);
      toast.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  // Update a single post in the list (used after vote or comment)
  const updatePost = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.postId === updatedPost.postId ? updatedPost : p))
    );
  };

  // Update only comments for a post
  const updatePostComments = (postId, comments) => {
    setPosts((prev) =>
      prev.map((p) => (p.postId === postId ? { ...p, comments } : p))
    );
  };

  return (
    <ForumContext.Provider
      value={{
        posts,
        setPosts,
        fetchPosts,
        selectedSub,
        loadingPosts,
        updatePost,
        updatePostComments, 
      }}
    >
      {children}
    </ForumContext.Provider>
  );
};

export const useForum = () => useContext(ForumContext);
