// src/pages/forum/PostDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../../api/axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import PostVote from "../../components/forum/PostVote";
import CommentsSection from "../../components/forum/CommentsSection";

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [upvotesCount, setUpvotesCount] = useState(0);
  const [downvotesCount, setDownvotesCount] = useState(0);
  const [userVote, setUserVote] = useState(0);

  // Fetch current user
  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.user || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPost = async () => {
    try {
      const res = await API.get(`/forum/posts/${id}`);
      const p = res.data;
      setPost(p);
      setUpvotesCount(p.upvotes?.length || 0);
      setDownvotesCount(p.downvotes?.length || 0);

      if (user) {
        const userIdStr = user._id.toString();
        const upvoted = p.upvotes?.some(u => u.toString() === userIdStr);
        const downvoted = p.downvotes?.some(u => u.toString() === userIdStr);
        setUserVote(upvoted ? 1 : downvoted ? -1 : 0);
      } else setUserVote(0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchPost();
  }, [id, user]);

  const handleVote = async (voteValue) => {
    if (!user) return toast.error("Please login to vote");
    try {
      const res = await API.post(`/forum/posts/${id}/vote`, { vote: voteValue });
      const data = res.data;
      setUpvotesCount(data.upvotesCount);
      setDownvotesCount(data.downvotesCount);
      setUserVote(data.userVote);
    } catch (err) {
      console.error(err);
      toast.error("Failed to vote");
    }
  };

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

        <PostVote
          userVote={userVote}
          upvotesCount={upvotesCount}
          downvotesCount={downvotesCount}
          handleVote={handleVote}
          user={user}
        />
      </div>

      <p className="mt-4 mb-6">{post.body}</p>

      <CommentsSection post={post} user={user} fetchPost={fetchPost} />
    </div>
  );
};

export default PostDetailPage;
