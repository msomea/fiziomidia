// src/components/forum/CommentsSection.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { useForum } from "../../context/ForumContext";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import { ChevronUp, ChevronDown } from "lucide-react";

const CommentsSection = ({ post, user, fetchPost }) => {
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest" or "oldest"
  const [commentsPerPage] = useState(5);
  const [displayedCount, setDisplayedCount] = useState(5);
  const { updatePostComments } = useForum();

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!user || user.role === "guest") return toast.error("Login to comment");

    try {
      setAdding(true);
      const res = await API.post(`/forum/posts/${post.postId}/comments`, { content: comment });
      toast.success("Comment added");
      setComment("");
      fetchPost();
      updatePostComments(post.postId, res.data.comments);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    } finally {
      setAdding(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const res = await API.delete(`/forum/posts/${post.postId}/comments/${commentId}`);
      toast.success("Comment deleted");
      fetchPost();
      updatePostComments(post.postId, res.data.comments);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete comment");
    }
  };

  // Edit comment
  const startEdit = (c) => {
    setEditingId(c._id);
    setEditingContent(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const saveEdit = async (commentId) => {
    if (!user?._id) {
      toast.error("You must be logged in to edit comments");
      return;
    }
    if (!editingContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      await API.put(`/forum/posts/${post.postId}/comments/${commentId}`, { content: editingContent });
      toast.success("Comment updated");
      cancelEdit();
      fetchPost(); // refetch post
    } catch (err) {
      console.error(err);
      toast.error("Failed to update comment");
    }
  };

  // Sort comments based on selected option
  const sortedComments = [...(post.comments || [])].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
    } else {
      return new Date(a.createdAt || a.updatedAt) - new Date(b.createdAt || b.updatedAt);
    }
  });

  // Paginate comments
  const displayedComments = sortedComments.slice(0, displayedCount);
  const hasMore = displayedCount < sortedComments.length;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + commentsPerPage);
  };

  return (
    <div className="mt-6 bg-white shadow-sm rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">Comments ({post.comments?.length || 0})</h3>
        {post.comments?.length > 0 && (
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setDisplayedCount(commentsPerPage); // Reset pagination on sort change
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        )}
      </div>

      {post.comments?.length > 0 ? (
        displayedComments.map((c) => (
          <div key={c._id} className="p-3 border-b border-gray-300 flex gap-3 justify-between">
            {/* Avatar */}
            <img
              src={c.author?.profileImageUrl ? `${API_URL}${c.author.profileImageUrl}` : avatar}
              alt={c.author?.fullName || "User"}
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
            />
            
            <div className="flex-1">
              {editingId === c._id ? (
                <div>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg p-2 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(c._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-800">{c.content}</p>
                  <small className="text-gray-500">
                    By <span className="font-medium">{c.author?.fullName || "Unknown"}</span> • {new Date(c.updatedAt || c.createdAt).toLocaleString()}
                  </small>
                </>
              )}
            </div>

            {user && user._id === c.author._id && editingId !== c._id && (
              <div className="flex gap-2 ml-4">
                <button onClick={() => startEdit(c)} className="text-blue-500 hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDeleteComment(c._id)} className="text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">No comments yet.</p>
      )}

      {/* Load More Button */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          className="w-full mt-3 py-2 text-caribbean font-medium hover:bg-alice rounded-lg transition-colors"
        >
          Load More Comments ({displayedCount} of {sortedComments.length})
        </button>
      )}

      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder={user?._id ? "Add a comment..." : "Login to comment"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 border border-gray-400 rounded-lg p-2"
          disabled={!user?._id}
        />
        <button
          type="submit"
          className="bg-caribbean text-white px-4 py-2 rounded-lg"
          disabled={adding || !user?._id}
        >
          {adding ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default CommentsSection;
