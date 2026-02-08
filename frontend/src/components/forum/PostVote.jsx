import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { toast } from "react-hot-toast";

const PostVote = ({ post, user, refreshPost }) => {
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteValue) => {
    if (!user?._id) {
      toast.error("You must be logged in to vote");
      return;
    }

    setLoading(true);

    try {
      await API.post(`${API_URL}/forum/posts/${post.postId}/vote`, { vote: voteValue });
      // Refresh post from backend to get updated vote counts
      refreshPost();
    } catch (err) {
      console.error(err);
      toast.error("Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 mt-3 text-gray-700">
      <button
        disabled={loading || !user?._id}
        onClick={() => handleVote(1)}
        className={`flex items-center gap-1 ${
          user?._id ? "hover:text-green-600" : "opacity-50 cursor-not-allowed"
        }`}
      >
        <ThumbsUp size={16} /> {post.upvotesCount || 0}
      </button>

      <button
        disabled={loading || !user?._id}
        onClick={() => handleVote(-1)}
        className={`flex items-center gap-1 ${
          user?._id ? "hover:text-red-600" : "opacity-50 cursor-not-allowed"
        }`}
      >
        <ThumbsDown size={16} /> {post.downvotesCount || 0}
      </button>
    </div>
  );
};

export default PostVote;
