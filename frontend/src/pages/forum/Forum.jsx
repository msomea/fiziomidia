import React, { useState, useEffect } from "react";
import ForumTopics from "../../components/forum/ForumTopics";
import ForumList from "../../components/forum/ForumList";
import { useNavigate } from "react-router";
import API from "../../api/axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // useAuth to get current user
  const [subs, setSubs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch posts for selected topic
  const fetchPosts = async (subId) => {
    if (!subId) return;
    try {
      const res = await API.get(`/forum/subs/${subId}/posts?page=1&limit=10`);
      setPosts(res.data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    }
  };

  // When a topic is selected
  const handleSelectTopic = (topic) => {
    setSelectedSub(topic);
    fetchPosts(topic._id);
  };

  useEffect(() => {
    setLoadingUser(false); // user already comes from context
  }, [user]);

  return (
    <div className="min-h-screen bg-alice mt-20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-caribbean">Forum</h1>
          
          {/* Only show New Post button for logged-in users */}
          {user?._id && (
            <button
              onClick={() => navigate("/forum/create")}
              className="btn p-2 bg-caribbean text-white hover:bg-tufts"
            >
              New Post
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Forum Topics (Subs) */}
          <div className="md:col-span-1">
            <ForumTopics onSelectTopic={handleSelectTopic} />
          </div>

          {/* Forum Posts */}
          <div className="md:col-span-2">
            <ForumList
              user={user}
              loading={loadingUser || !selectedSub}
              posts={posts}
              subId={selectedSub?._id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
