import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const PostVote = ({ userVote, upvotesCount, downvotesCount, handleVote, user }) => {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => handleVote(1)}
        disabled={!user}
        className={`p-2 rounded-full ${userVote === 1 ? "bg-green-100 text-green-600" : "hover:bg-gray-200 text-gray-500"}`}
      >
        <ThumbsUp size={22} />
      </button>
      <span className="font-semibold text-gray-700 my-1">
        {upvotesCount} / {downvotesCount}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={!user}
        className={`p-2 rounded-full ${userVote === -1 ? "bg-red-100 text-red-600" : "hover:bg-gray-200 text-gray-500"}`}
      >
        <ThumbsDown size={22} />
      </button>
    </div>
  );
};

export default PostVote;
