// src/components/forum/CommentsSection.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { useForum } from "../../context/ForumContext";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";

const COMMENTS_PER_PAGE = 5;

const CommentsSection = ({ post, user, fetchPost }) => {
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [displayedCount, setDisplayedCount] = useState(COMMENTS_PER_PAGE);

  const { updatePostComments } = useForum();

  /* ---------------- Add Comment ---------------- */
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!user?._id) return toast.error("Login to comment");

    try {
      setAdding(true);
      const res = await API.post(
        `/forum/posts/${post.postId}/comments`,
        { content: comment.trim() }
      );

      toast.success("Comment added");
      setComment("");
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

  /* ---------------- Delete Comment ---------------- */
  const handleDeleteComment = async (commentId) => {
    try {
      const res = await API.delete(
        `/forum/posts/${post.postId}/comments/${commentId}`
      );

      toast.success("Comment deleted");
      setDisplayedCount(COMMENTS_PER_PAGE);
      updatePostComments(post.postId, res.data.comments);
      fetchPost();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete comment");
    }
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
        `/forum/posts/${post.postId}/comments/${commentId}`,
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
  const sortedComments = [...(post.comments || [])].sort((a, b) => {
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
          <div
            key={c._id}
            className="p-3 border-b border-gray-300 flex gap-3"
          >
            <img
              src={
                c.author?.profileImageUrl
                  ? `${API_URL}${c.author.profileImageUrl}`
                  : avatar
              }
              alt={c.author?.fullName || "User"}
              className="w-8 h-8 rounded-full object-cover"
            />

            <div className="flex-1">
              {editingId === c._id ? (
                <>
                  <textarea
                    autoFocus
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full border rounded-lg p-2 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(c._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-400 text-white px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-800">{c.content}</p>
                  <small className="text-gray-500">
                    By <span className="font-medium">
                      {c.author?.fullName || "Unknown"}
                    </span>{" "}
                    • {new Date(c.updatedAt || c.createdAt).toLocaleString()}
                    {c.updatedAt !== c.createdAt && " (edited)"}
                  </small>
                </>
              )}
            </div>

            {user?._id === c.author?._id && editingId !== c._id && (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(c)}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteComment(c._id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">No comments yet.</p>
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
          value={comment}
          onChange={(e) => setComment(e.target.value)}
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
