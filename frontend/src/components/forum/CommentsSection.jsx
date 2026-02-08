// src/components/forum/CommentsSection.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { useForum } from "../../context/ForumContext";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import CommentItem from "./CommentItem";

const COMMENTS_PER_PAGE = 5;

const CommentsSection = ({ post, user, fetchPost, socket }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [displayedCount, setDisplayedCount] = useState(COMMENTS_PER_PAGE);

  const { updatePostComments } = useForum();

  useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  useEffect(() => {
    if (!socket || !post?.postId) return;
    // For comment events we re-fetch the post so the client always
    // receives the fully nested comment tree (keeps logic simple).
    socket.on("comment:new", () => fetchPost());
    socket.on("comment:updated", () => fetchPost());
    socket.on("comment:deleted", () => fetchPost());

    return () => {
      socket.off("comment:new");
      socket.off("comment:updated");
      socket.off("comment:deleted");
    };
  }, [socket, post?.postId]);

  /* ---------------- Add Comment ---------------- */
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user?._id) return toast.error("Login to comment");

    try {
      setAdding(true);
      const res = await API.post(`${API_URL}/forum/posts/${post.postId}/comments`, {
        content: newComment.trim(),
      });

      toast.success("Comment added");
      setNewComment("");
      setDisplayedCount(COMMENTS_PER_PAGE);
      updatePostComments(post.postId, res.data.comments);
      fetchPost();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    } finally {
      setAdding(false);
    }
  };
  /* ----------------------- Reply Comment ----------------------- */
  const handleReply = async (parentId, content) => {
  if (!user?._id) return toast.error("Login to reply");

  try {
    const res = await API.post(
      `${API_URL}/forum/posts/${post.postId}/comments`,
      { content, parentComment: parentId }
    );

    updatePostComments(post.postId, res.data.comments);
    fetchPost();
  } catch (err) {
    console.error(err);
    toast.error("Failed to post reply");
  }
};


  /* ---------------- Delete Comment ---------------- */
  const handleDeleteComment = async (commentId) => {
    const backup = post.comments;
    setComments((prev) => prev.filter((c) => c._id !== commentId));

    let undoClicked = false;

    const toastUndo = toast((t) => (
      <div className="flex items-center gap-3">
        <span>Comment deleted</span>
        <button
          onClick={() => {
            undoClicked = true;
            setComments(backup);
            toast.dismiss(t.id);
          }}
          className="text-blue-500 underline"
        >
          Undo
        </button>
      </div>
    ));

    const timeoutId = setTimeout(async () => {
      // Only proceed with delete if undo was not clicked
      if (undoClicked) return;

      try {
        const res = await API.delete(
          `${API_URL}/forum/posts/${post.postId}/comments/${commentId}`
        );

        setDisplayedCount(COMMENTS_PER_PAGE);
        updatePostComments(post.postId, res.data.comments);
        fetchPost();
      } catch (err) {
        console.error(err);
        setComments(backup);
        toast.error("Failed to delete comment");
      }
    }, 5000);
  };

  /* ---------------- Edit Comment ---------------- */
  const startEdit = (c) => {
    setEditingId(c._id);
    setEditingContent(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const saveEdit = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const res = await API.put(
        `${API_URL}/forum/posts/${post.postId}/comments/${commentId}`,
        { content: editingContent.trim() }
      );

      toast.success("Comment updated");
      cancelEdit();
      updatePostComments(post.postId, res.data.comments);
      fetchPost();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update comment");
    }
  };

  /* ---------------- Sorting & Pagination ---------------- */
  const topLevelComments = comments.filter((c) => !c.parentComment);

  const sortedComments = [...topLevelComments].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt);
    const dateB = new Date(b.updatedAt || b.createdAt);
    return sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  const displayedComments = sortedComments.slice(0, displayedCount);
  const hasMore = displayedCount < sortedComments.length;

  /* ---------------- UI ---------------- */
  return (
    <div className="mt-6 bg-white shadow-sm rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">
          Comments ({post.comments?.length || 0})
        </h3>

        {post.comments?.length > 0 && (
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setDisplayedCount(COMMENTS_PER_PAGE);
            }}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        )}
      </div>

      {displayedComments.length ? (
        displayedComments.map((c) => (
          <CommentItem
            key={c._id}
            comment={c}
            user={user}
            post={post}
            postId={post.postId}
            onReply={handleReply}
            onEdit={startEdit}
            onDelete={handleDeleteComment}
            editingId={editingId}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            cancelEdit={cancelEdit}
            saveEdit={saveEdit}
          />
        ))
      ) : (
        <p className="text-gray-500 text-sm">No comments yet. Be the first to add</p>
      )}


      {hasMore && (
        <button
          onClick={() =>
            setDisplayedCount((prev) => prev + COMMENTS_PER_PAGE)
          }
          className="w-full mt-3 py-2 font-medium hover:bg-gray-100 rounded-lg"
        >
          Load more ({displayedCount}/{sortedComments.length})
        </button>
      )}

      <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder={user?._id ? "Add a comment…" : "Login to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border rounded-lg p-2"
          disabled={!user?._id}
        />
        <button
          type="submit"
          disabled={adding || !user?._id}
          className="bg-caribbean text-white px-4 py-2 rounded-lg"
        >
          {adding ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
};

export default CommentsSection;
