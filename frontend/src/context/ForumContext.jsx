import React, { createContext, useContext, useState } from "react";
import API from "../api/axios";
import { API_URL } from "../config/constants";
import { toast } from "react-hot-toast";

const ForumContext = createContext();

export const ForumProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);

  // Fetch Subforum details
  const fetchSub = async (subId) => {
    if (!subId) return;

    try {
      setLoadingSub(true);
      const res = await API.get(`${API_URL}/forum/subs/${subId}`);
      const fullSub = res.data.sub || res.data;

      setSelectedSub(fullSub);

      return fullSub;
    } catch (err) {
      console.error("Error fetching sub:", err);
      toast.error("Failed to load topic details");
      return null;
    } finally {
      setLoadingSub(false);
    }
  };

  // Fetch posts for a sub (requires full sub)
  const fetchPosts = async (subId) => {
    if (!subId) return;

    try {
      setLoadingPosts(true);

      // Ensure we have full sub object
      let fullSub = selectedSub;
      if (!fullSub || fullSub._id !== subId) {
        fullSub = await fetchSub(subId);
      }

      const res = await API.get(`${API_URL}/forum/subs/${subId}/posts?page=1&limit=10`);
      setPosts(res.data.posts || []);

    } catch (err) {
      console.error("Error fetching posts:", err);
      toast.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  // Update a single post (after vote or comment)
  const updatePost = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.postId === updatedPost.postId ? updatedPost : p))
    );
  };

  // Update comment list only
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
        selectedSub,
        setSelectedSub,
        loadingPosts,
        loadingSub,
        fetchSub,
        fetchPosts,
        updatePost,
        updatePostComments,
      }}
    >
      {children}
    </ForumContext.Provider>
  );
};

export const useForum = () => useContext(ForumContext);
