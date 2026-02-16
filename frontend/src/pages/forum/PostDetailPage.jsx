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
import { getSocket } from "../../socket";
import { t } from "i18next";

// 🔧 Build nested comment tree
const buildCommentTree = (comments = []) => {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    map[c._id] = { ...c, replies: [] };
  });

  comments.forEach((c) => {
    if (c.parentComment && map[c.parentComment]) {
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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const socket = getSocket();

  const canEdit = user && (user.role === "admin" || user._id === post?.author?._id);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await API.get(`${API_URL}/forum/posts/${id}`);
      const p = res.data;

      const nestedComments = buildCommentTree(p.comments || []);
      const normalizedPost = { ...p, comments: nestedComments };

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
    if (!id) return;

    fetchPost();
    socket.emit("joinPostRoom", id);

    return () => {
      socket.emit("leavePostRoom", id);
    };
  }, [id, socket]);

  const handleEditStart = () => {
    setEditTitle(post.title);
    setEditBody(post.body);
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    try {
      const res = await API.put(`${API_URL}/forum/posts/${id}`, {
        title: editTitle,
        body: editBody,
      });

      const updatedPost = {
        ...res.data.post,
        comments: buildCommentTree(res.data.post.comments || []),
      };

      setPost(updatedPost);
      updatePost(updatedPost);
      toast.success("Post updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update post");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_posts")}
        </p>
      </div>
    );
  }

  if (!post) {
    return <p className="text-center text-gray-500">Post not found</p>;
  }

  return (
    <div className="max-w-3xl mt-20 mx-auto p-6 bg-white text-black rounded-xl shadow-md">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {/* Title */}
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold border p-2 rounded mb-3"
            />
          ) : (
            <h1 className="text-2xl font-bold text-caribbean mb-3">{post.title}</h1>
          )}

          {/* Body */}
          {isEditing ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full border p-3 rounded mb-6 min-h-[150px]"
            />
          ) : (
            <p className="mt-2 mb-6 whitespace-pre-wrap break-words">{post.body}</p>
          )}

          {/* Edit Buttons */}
          {canEdit && !isEditing && (
            <button
              onClick={handleEditStart}
              className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              {t("edit_post")}
            </button>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                className="text-sm px-3 py-1 bg-caribbean text-white rounded"
              >
                {t("save_changes")}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm px-3 py-1 bg-gray-300 rounded"
              >
                {t("cancel")}
              </button>
            </div>
          )}
        </div>

        <PostVote post={post} user={user} refreshPost={fetchPost} />
      </div>

      {/* Comments */}
      <CommentsSection post={post} user={user} fetchPost={fetchPost} socket={socket} />
    </div>
  );
};

export default PostDetailPage;
