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

  const fetchPost = async () => {
    try {
      const res = await API.get(`/forum/posts/${id}`);
      setPost(res.data);
      console.log(res.data)
    } catch (err) {
      console.error(err);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

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

  if (loading) return <p className="text-center text-gray-500">Loading post...</p>;
  if (!post) return <p className="text-center text-gray-500">Post not found</p>;

  return (
    <>
      <div className="max-w-3xl mt-20 mx-auto p-6 bg-white text-black rounded-xl shadow-md">
        {/* Post Content */}
        <h1 className="text-2xl font-bold text-caribbean mb-2">{post.title}</h1>
        <p className="text-gray-600 mb-4">
          By {post.author?.fullName || "Unknown"} • {dayjs(post.createdAt).format("ddd, DD/MM/YYYY")}
        </p>
        <p className="mb-6">{post.body}</p>

        {/* Comments Section */}
        <div className="mt-6 bg-white shadow-sm rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3">Comments ({post.comments?.length || 0})</h3>
          {post.comments && post.comments.length > 0 ? (
            <ul className="space-y-4">
              {post.comments.map((comment) => (
                <li key={comment._id} className="border-b pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{comment.author.fullName}</span>
                    <span className="text-gray-400 text-sm">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No comments yet.</p>
          )}
        </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
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
    </>
  );
};

export default PostDetailPage;
