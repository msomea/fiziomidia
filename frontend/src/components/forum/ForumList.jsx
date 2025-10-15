import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2 } from "lucide-react";
import avatar from "../../assets/avatar.jpg";

const ForumList = ({ posts = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = Math.min(startIndex + postsPerPage, totalPosts);

  const currentPosts = posts.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">
        Showing {startIndex + 1} to {endIndex} of {totalPosts} posts
      </p>

      {currentPosts.map((post) => (
        <div
          key={post._id}
          className="bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row gap-4"
        >
          {/* PT Avatar */}
          <img
            src={post.author.avatar || avatar}
            alt={post.author.fullName}
            className="w-12 h-12 rounded-full object-cover"
          />

          {/* Post Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-black">{post.author.fullName}</span>
              <span className="text-gray-400 text-sm">{formatDate(post.createdAt)}</span>
            </div>
            <h3 className="text-lg font-bold text-caribbean mb-2">{post.title}</h3>
            <p className="text-gray-700 text-sm line-clamp-3">{post.body}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3 text-gray-500">
              <div className="flex items-center gap-1 cursor-pointer">
                <ThumbsUp size={16} /> {post.upvotes?.length || 0}
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <ThumbsDown size={16} /> {post.downvotes?.length || 0}
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <MessageCircle size={16} /> {post.comments?.length || 0}
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <Share2 size={16} /> Share
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`btn btn-sm ${currentPage === i + 1 ? "btn-active" : ""}`}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ForumList;
