import React, { useState, useEffect } from "react";
import { ThumbsUp, Loader2, ThumbsDown, MessageCircle, Share2 } from "lucide-react";
import avatar from "../../assets/avatar.jpg";
import { Link } from "react-router";
import API from "../../api/axios";
import { toast } from "react-hot-toast";
import { API_URL } from "../../config/constants";

const DEFAULT_AUTHOR = {
  fullName: "Guest",
  profileImageUrl: avatar,
  _id: null,
};

const ForumList = ({ posts = [], loading, user, currentTopic }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [postList, setPostList] = useState(posts);
  const postsPerPage = 10;

  useEffect(() => {
    setPostList(posts);
    setCurrentPage(1);
  }, [posts]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Posts...</p>
      </div>
    );
  }

  if (!posts.length) {
    return <p className="text-center mt-6 text-gray-500">No posts yet.</p>;
  }

  const totalPosts = postList.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = Math.min(startIndex + postsPerPage, totalPosts);
  const currentPosts = postList.slice(startIndex, endIndex);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleVote = async (postId, voteValue) => {
    if (!user?._id) {
      toast.error("You must be logged in to vote");
      return;
    }

    // Optimistic UI update
    setPostList((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;

        let upvotes = p.upvotes || [];
        let downvotes = p.downvotes || [];

        upvotes = upvotes.filter((u) => u !== user._id);
        downvotes = downvotes.filter((u) => u !== user._id);

        if (voteValue === 1) upvotes.push(user._id);
        else downvotes.push(user._id);

        return { ...p, upvotes, downvotes };
      })
    );

    try {
      await API.post(`/forum/posts/${postId}/vote`, { vote: voteValue });
    } catch (err) {
      console.error(err);
      toast.error("Failed to vote");
      setPostList(posts);
    }
  };

  // --- Prepare Pinned Sponsor Post ---
  const pinnedSponsorPost = currentTopic?.isSponsored
    ? {
        _id: `sponsor-${currentTopic._id}`,
        author: {
          fullName: currentTopic.sponsorName,
          profileImageUrl: currentTopic.sponsorLogo ? `${API_URL}${currentTopic.sponsorLogo}` : avatar,
          _id: null,
        },
        title: currentTopic.sponsorWebsite || currentTopic.title,
        body: currentTopic.sponsorMessage || "",
        upvotes: [],
        downvotes: [],
        comments: [],
        createdAt: new Date(currentTopic.startDate || Date.now()),
      }
    : null;

  // --- Merge pinned post on top ---
  const displayedPosts = pinnedSponsorPost ? [pinnedSponsorPost, ...currentPosts] : currentPosts;

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">
        Showing {startIndex + 1} to {Math.min(endIndex, totalPosts)} of {totalPosts} posts
      </p>

      {displayedPosts.map((post) => {
        const author = post.author || DEFAULT_AUTHOR;
        const isSponsorPost = post._id.startsWith("sponsor-");

        return (
          <div
            key={post._id}
            className={`bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row gap-4 ${
              isSponsorPost ? "border-2 border-yellow-400" : ""
            }`}
          >
            <img
              src={author.profileImageUrl || avatar}
              alt={author.fullName || "Guest"}
              onError={(e) => { e.target.src = avatar; }}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-black">
                  {isSponsorPost ? (
                    <p>
                      {author.fullName}
                      <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs ml-2">
                      Sponsored
                      </span>
                    </p>
                  ):(
                      <Link
                        to={`/profile/pt/${author._id}`} >
                          <span className="font-semibold text-black">{author.fullName}</span> 
                      </Link>
                  )}
                </span>
                <span className="text-gray-400 text-sm">{formatDate(post.createdAt)}</span>
              </div>

              {isSponsorPost ? (
                <a
                  href={post.title}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-bold text-caribbean mb-2 block"
                >
                  {post.title}
                </a>
              ) : (
                <Link to={`/forum/post/${post._id}`} className="text-lg font-bold text-caribbean mb-2 block">
                  {post.title}
                </Link>
              )}

              <p className="text-gray-700 text-sm line-clamp-3">{post.body}</p>

              <div className="flex items-center gap-4 mt-3 text-gray-500">
                <button
                  onClick={() => handleVote(post._id, 1)}
                  className={`flex items-center gap-1 ${user?._id ? "hover:text-green-600" : "cursor-not-allowed opacity-50"}`}
                  disabled={!user?._id || isSponsorPost}
                >
                  <ThumbsUp size={16} /> {post.upvotes?.length || 0}
                </button>

                <button
                  onClick={() => handleVote(post._id, -1)}
                  className={`flex items-center gap-1 ${user?._id ? "hover:text-red-600" : "cursor-not-allowed opacity-50"}`}
                  disabled={!user?._id || isSponsorPost}
                >
                  <ThumbsDown size={16} /> {post.downvotes?.length || 0}
                </button>

                <div className="flex items-center gap-1 cursor-pointer">
                  <MessageCircle size={16} /> {post.comments?.length || 0}
                </div>

                <div className="flex items-center gap-1 cursor-pointer">
                  <Share2 size={16} /> Share
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex justify-center gap-2 mt-4">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`btn p-1 border border-caribbean text-caribbean hover:bg-tufts hover:text-white ${currentPage === i + 1 ? "btn-active" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ForumList;
