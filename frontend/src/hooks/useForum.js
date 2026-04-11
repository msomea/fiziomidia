import { useState, useCallback } from 'react';
import { useApiData } from './useApiData';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { API_URL } from '../config/constants';
import {
  fetchForumSubs,
  fetchSubById,
  fetchPostsInSub,
  votePost,
  createPost,
  addComment,
  deleteComment,
} from "../api/forum";

/**
 * Hook for forum data management
 */
export const useForumData = () => {
  const [posts, setPosts] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [userPermissions, setUserPermissions] = useState({
    isMod: false,
    isOwner: false,
    hasPendingRequest: false
  });

  // Consolidated fetch for forum page data (subforum + posts + permissions)
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

  // Update a single post (after vote or comment)
  const updatePost = useCallback((updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.postId === updatedPost.postId ? updatedPost : p))
    );
  }, []);

  // Update comment list only
  const updatePostComments = useCallback((postId, comments) => {
    setPosts((prev) =>
      prev.map((p) => (p.postId === postId ? { ...p, comments } : p))
    );
  }, []);

  // Vote on a post
  const handleVotePost = useCallback(async (postId, voteType) => {
    try {
      const result = await votePost(postId, voteType);
      updatePost(result.post || result);
      return result;
    } catch (err) {
      toast.error("Failed to vote on post");
      throw err;
    }
  }, [updatePost]);

  // Add a comment to a post
  const handleAddComment = useCallback(async (postId, content) => {
    try {
      const result = await addComment(postId, content);
      updatePostComments(postId, result.comments || []);
      return result;
    } catch (err) {
      toast.error("Failed to add comment");
      throw err;
    }
  }, [updatePostComments]);

  // Delete a comment
  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      await deleteComment(commentId);
      // Refresh posts to get updated comments
      if (selectedSub) {
        await refreshPosts(selectedSub._id);
      }
      return true;
    } catch (err) {
      toast.error("Failed to delete comment");
      throw err;
    }
  }, [selectedSub, refreshPosts]);

  return {
    posts,
    setPosts,
    selectedSub,
    setSelectedSub,
    loadingPosts,
    loadingSub,
    userPermissions,
    setUserPermissions,
    fetchForumPageData,
    refreshPosts,
    checkModRequestStatus,
    updatePost,
    updatePostComments,
    handleVotePost,
    handleAddComment,
    handleDeleteComment
  };
};

/**
 * Hook for forum subs (topics) management
 */
export const useForumSubs = () => {
  const { data: subs, loading, error, refetch } = useApiData(fetchForumSubs, {
    showToast: false
  });

  return { subs, loading, error, refetch };
};

/**
 * Hook for single sub details
 */
export const useForumSub = (subId) => {
  const { data: sub, loading, error, refetch } = useApiData(
    () => fetchSubById(subId),
    {
      immediate: !!subId,
      dependencies: [subId]
    }
  );

  return { sub, loading, error, refetch };
};
