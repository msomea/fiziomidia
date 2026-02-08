// src/pages/forum/PostDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useForum } from "../../context/ForumContext";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import PostVote from "../../components/forum/PostVote";
import CommentsSection from "../../components/forum/CommentsSection";
import dayjs from "dayjs";
import { getSocket } from "../../socket";

/* 🔧 Build nested comment tree (safe even if already nested) */
const buildCommentTree = (comments = []) => {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    map[c._id] = { ...c, replies: c.replies || [] };
  });

  comments.forEach((c) => {
    if (c.parentComment) {
      map[c.parentComment]?._id &&
        map[c.parentComment].replies.push(map[c._id]);
    } else {
      roots.push(map[c._id]);
    }
  });

  return roots;
};

const PostDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { updatePost } = useForum();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = getSocket();
  const fetchPost = async () => {
    try {
      const res = await API.get(`${API_URL}/forum/posts/${id}`);
      const p = res.data;

      // ✅ Ensure comments are nested
      const nestedComments = buildCommentTree(p.comments || []);

      const normalizedPost = {
        ...p,
        comments: nestedComments
      };

      setPost(normalizedPost);
      updatePost(normalizedPost);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    if (!id) return;

    // Join a room for this post
    socket.emit("joinPostRoom", id);

    // Cleanup on unmount
    return () => {
      socket.emit("leavePostRoom", id);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          Loading Post...
        </p>
      </div>
    );
  }

  if (!post) {
    return <p className="text-center text-gray-500">Post not found</p>;
  }

  return (
    <div className="max-w-3xl mt-20 mx-auto p-6 bg-white text-black rounded-xl shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-caribbean mb-2">
            {post.title}
          </h1>
          <p className="text-gray-600 mb-2">
            By {post.author?.fullName || "Unknown"} •{" "}
            {dayjs(post.createdAt).format("ddd, DD/MM/YYYY")}
          </p>
        </div>

        <PostVote post={post} user={user} refreshPost={fetchPost} />
      </div>

      <p className="mt-4 mb-6">{post.body}</p>

      {/* ✅ Nested comments now rendered */}
      <CommentsSection post={post} user={user} fetchPost={fetchPost} socket={socket}/>
    </div>
  );
};

export default PostDetailPage;
