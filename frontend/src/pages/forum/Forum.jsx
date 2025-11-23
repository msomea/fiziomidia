// src/pages/forum/Forum.jsx
import React, { useEffect } from "react";
import ForumTopics from "../../components/forum/ForumTopics";
import ForumList from "../../components/forum/ForumList";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useForum } from "../../context/ForumContext";

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, fetchPosts, selectedSub, loadingPosts } = useForum();

  const handleSelectTopic = (topic) => {
    fetchPosts(topic._id);
  };

  return (
    <div className="min-h-screen bg-alice mt-20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-caribbean">Forum</h1>
          {user.role !== "guest" && user.role !== "member" && (
            <button
              onClick={() => navigate("/forum/create")}
              className="btn p-2 bg-caribbean text-white hover:bg-tufts"
            >
              New Post
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ForumTopics onSelectTopic={handleSelectTopic} />
          </div>

          <div className="md:col-span-2">
            <ForumList
              user={user}
              posts={posts}
              loading={loadingPosts || !selectedSub}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
