import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router";
import API from "../../api/axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import PostVote from "../../components/forum/PostVote";
import CommentsSection from "../../components/forum/CommentsSection";
import { AuthContext } from "../../context/AuthContext";

const PostDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext); // get logged-in user from context
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    try {
      setLoading(true);
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
    fetchPost();
  }, [id]);

  if (loading) return <p className="text-center text-gray-500">Loading post...</p>;
  if (!post) return <p className="text-center text-gray-500">Post not found</p>;

  return (
    <div className="max-w-3xl mt-20 mx-auto p-6 bg-white text-black rounded-xl shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-caribbean mb-2">{post.title}</h1>
          <p className="text-gray-600 mb-2">
            By {post.author?.fullName || "Unknown"} • {dayjs(post.createdAt).format("ddd, DD/MM/YYYY")}
          </p>
        </div>

        <PostVote post={post} refreshPost={fetchPost} user={user} />
      </div>

      <p className="mt-4 mb-6">{post.body}</p>

      <CommentsSection post={post} user={user} fetchPost={fetchPost} />
    </div>
  );
};

export default PostDetailPage;
