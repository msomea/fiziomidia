import React, { createContext, useContext, useState, useCallback } from "react";
import API from "../api/axios";
import { API_URL } from "../config/constants";
import { toast } from "react-hot-toast";

const ForumContext = createContext();

export const ForumProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [userPermissions, setUserPermissions] = useState({
    isMod: false,
    isOwner: false,
    hasPendingRequest: false
  });

  // 🚀 Consolidated fetch for forum page data (subforum + posts + permissions)
  const fetchForumPageData = useCallback(async (subId, options = {}) => {
    if (!subId) return;

    try {
      setLoadingSub(true);
      setLoadingPosts(true);

      const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 10,
      });

      const res = await API.get(`${API_URL}/forum/subs/${subId}/forum-page?${params}`);
      const data = res.data;

      if (data.success) {
        setSelectedSub(data.subforum);
        setPosts(data.posts || []);
        setUserPermissions(data.userPermissions || {});
        return data;
      }
    } catch (err) {
      console.error("Error fetching forum page data:", err);
      toast.error("Failed to load forum data");
      return null;
    } finally {
      setLoadingSub(false);
      setLoadingPosts(false);
    }
  }, []);

  // Fetch Subforum details (legacy - kept for compatibility)
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

  // Fetch posts for a sub (legacy - kept for compatibility)
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

  // Refresh posts only (for pagination or new posts)
  const refreshPosts = useCallback(async (subId, options = {}) => {
    if (!subId) return;

    try {
      setLoadingPosts(true);

      const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 10,
      });

      const res = await API.get(`${API_URL}/forum/subs/${subId}/posts?${params}`);
      setPosts(res.data.posts || []);
      
      return res.data;
    } catch (err) {
      console.error("Error refreshing posts:", err);
      toast.error("Failed to refresh posts");
      return null;
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Check mod request status (for PT users)
  const checkModRequestStatus = useCallback(async (subId) => {
    if (!subId || !userPermissions) return;

    try {
      const res = await API.get(`${API_URL}/forum/subs/${subId}/my-mod-request`);
      const hasRequested = res.data.requested || res.data.alreadyMod || false;
      
      setUserPermissions(prev => ({
        ...prev,
        hasPendingRequest: hasRequested
      }));

      return hasRequested;
    } catch (err) {
      console.error("Failed to check mod request:", err);
      return false;
    }
  }, [userPermissions]);

  return (
    <ForumContext.Provider
      value={{
        posts,
        setPosts,
        selectedSub,
        setSelectedSub,
        loadingPosts,
        loadingSub,
        userPermissions,
        setUserPermissions,
        fetchForumPageData,
        fetchSub,
        fetchPosts,
        updatePost,
        updatePostComments,
        refreshPosts,
        checkModRequestStatus,
      }}
    >
      {children}
    </ForumContext.Provider>
  );
};

export const useForum = () => useContext(ForumContext);
