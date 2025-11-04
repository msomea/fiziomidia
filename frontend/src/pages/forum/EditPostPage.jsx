import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { toast } from "react-hot-toast";

const EditPostPage = () => {
  const { postId, ptId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await API.get(`/forum/posts/${postId}`);
        setPost(res.data);
        setTitle(res.data.title);
        setBody(res.data.body);
        console.log("body", res.data.body)
      } catch (err) {
        console.error("Error fetching post:", err);
        toast.error("Failed to load post details");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(`/forum/posts/${postId}`, { title, body });
      toast.success("Post updated successfully");
      navigate(`/forum/pt/posts/${ptId}`); 
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="text-center mt-6 text-gray-500">Loading post...</p>;

  if (!post)
    return (
      <p className="text-center mt-6 text-red-500">
        Post not found or deleted.
      </p>
    );

  return (
    <div className="max-w-3xl mt-20 mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl text-caribbean font-semibold mb-4">Edit Post</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caribbean font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>

        <div>
          <label className="block text-caribbean font-medium mb-1">Content</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="8"
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            required
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-red-500 border rounded hover:bg-gray-100 hover:text-caribbean"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;
