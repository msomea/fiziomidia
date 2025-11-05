// src/pages/forum/PostDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../../api/axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  // ✅ Fetch current user
  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.user || res.data);
    } catch (err) {
      console.error("Error fetching User:", err);
      toast.error("Failed to load user info");
    }
  };

  // ✅ Fetch post (including comments)
  const fetchPost = async () => {
    try {
      const res = await API.get(`/forum/posts/${id}`);
      setPost(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPost();
  }, [id]);

  // ✅ Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setAdding(true);
      await API.post(`/forum/posts/${id}/comments`, { content: comment });
      toast.success("Comment added");
      setComment("");
      fetchPost(); // refresh comments
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    } finally {
      setAdding(false);
    }
  };

  // ✅ Delete comment (then refetch)
  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/forum/posts/${id}/comments/${commentId}`);
      toast.success("Comment deleted");
      await fetchPost(); // Re-fetch post so remaining comments show
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete comment");
    }
  };

  // ✅ Begin editing a comment
  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditingContent(comment.content);
  };

  // ✅ Cancel edit mode
  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  // ✅ Save edited comment
  const saveEdit = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const res = await API.put(`/forum/posts/${id}/comments/${commentId}`, {
        content: editingContent.trim(),
      });

      const updatedComment = res.data.comment || res.data;

      setPost((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === updatedComment._id ? updatedComment : c
        ),
      }));

      toast.success("Comment updated");
      cancelEdit();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update comment");
    }
  };

  if (loading)
    return <p className="text-center text-gray-500">Loading post...</p>;
  if (!post)
    return <p className="text-center text-gray-500">Post not found</p>;

  return (
    <div className="max-w-3xl mt-20 mx-auto p-6 bg-white text-black rounded-xl shadow-md">
      {/* Post Content */}
      <h1 className="text-2xl font-bold text-caribbean mb-2">{post.title}</h1>
      <p className="text-gray-600 mb-4">
        By {post.author?.fullName || "Unknown"} •{" "}
        {dayjs(post.createdAt).format("ddd, DD/MM/YYYY")}
      </p>
      <p className="mb-6">{post.body}</p>

      {/* Comments Section */}
      <div className="mt-6 bg-white shadow-sm rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3">
          Comments ({post.comments?.length || 0})
        </h3>

        {post.comments && post.comments.length > 0 ? (
          post.comments.map((c) => (
            <div
              key={c._id}
              className="p-3 border-b border-gray-300 flex justify-between"
            >
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
                      By {c.author.fullName} at{" "}
                      {new Date(c.updatedAt).toLocaleString()}
                    </small>
                  </>
                )}
              </div>

              {user && user._id === c.author._id && editingId !== c._id && (
                <div className="flex gap-2 ml-4">
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
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 border border-gray-400 rounded-lg p-2"
        />
        <button
          type="submit"
          className="bg-caribbean text-white px-4 py-2 rounded-lg"
          disabled={adding}
        >
          {adding ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default PostDetailPage;
