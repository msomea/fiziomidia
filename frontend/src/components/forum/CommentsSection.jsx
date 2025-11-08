// src/components/forum/CommentsSection.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { useForum } from "../../context/ForumContext";

const CommentsSection = ({ post, user, fetchPost }) => {
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
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

  return (
    <div className="mt-6 bg-white shadow-sm rounded-xl p-4">
      <h3 className="text-lg font-bold mb-3">Comments ({post.comments?.length || 0})</h3>

      {post.comments?.length > 0 ? (
        post.comments.map((c) => (
          <div key={c._id} className="p-3 border-b border-gray-300 flex justify-between">
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
                    By {c.author.fullName} at {new Date(c.updatedAt).toLocaleString()}
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
