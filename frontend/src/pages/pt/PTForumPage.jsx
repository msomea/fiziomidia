import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { NotebookPen, PlusSquareIcon, Trash2Icon } from "lucide-react";


const PTForumPage = () => {
  const [posts, setPosts] = useState([]);
  const [pt, setPt] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in PT
  useEffect(() => {
    const fetchPT = async () => {
      try {
        const res = await API.get("/auth/me"); // Adjust if different endpoint
        setPt(res.data.user || res.data);
      } catch (err) {
        console.error("Error fetching PT:", err);
        toast.error("Failed to load user info");
      }
    };
    fetchPT();
  }, []);

  // Fetch forum posts for PT
  useEffect(() => {
    const fetchPosts = async () => {
      if (!pt?._id) return;
      setLoading(true);
      try {
        const res = await API.get(`/forum?ptId=${pt._id}&limit=${limit}&page=${page}`);
        setPosts(res.data.posts || res.data);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Error fetching posts:", err);
        toast.error("Failed to load forum posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [pt, page]);

  // Delete post
  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await API.delete(`/forum/posts/${postId}`);
      toast.success("Post deleted");
      setPosts(posts.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete post");
    }
  };

  if (loading) return <p className="text-center text-caribbean mt-6">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto mt-14 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-caribbean font-semibold">My Forum Posts</h1>
        <Link to="/forum/create" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
        <PlusSquareIcon className=""/>
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">You haven’t posted anything yet.</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-caribbean text-left font-semibold">Title</th>
                <th className="py-3 px-4 text-caribbean text-left font-semibold">Date</th>
                <th className="py-3 px-4 text-caribbean text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 text-black px-4">{post.title}</td>
                  <td className="py-3 text-black px-4">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 space-x-2 flex items-center gap-1">
                    <Link
                      to={`/forum/edit/${pt._id}/${post._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      <NotebookPen />
                    </Link>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="text-red-600 hover:underline"
                    >
                      <Trash2Icon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex text-caribbean justify-center mt-4 space-x-3 ">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-caribbean rounded disabled:opacity-50 hover:bg-tufts hover:text-black"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-caribbean rounded disabled:opacity-50 hover:bg-tufts hover:text-black"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PTForumPage;
