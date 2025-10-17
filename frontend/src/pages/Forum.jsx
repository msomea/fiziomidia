import React, { useState, useEffect } from "react";
import ForumTopics from "../components/forum/ForumTopics";
import ForumList from "../components/forum/ForumList";
import { useNavigate } from "react-router";
import API from "../api/axios";

const Forum = () => {
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);

  // Fetch Forum Topics (Subs)
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await API.get("/api/forum/subs");
        const subsData = res.data.subs || [];
        setSubs(subsData);
        if (subsData.length > 0) {
          setSelectedSub(subsData[0]); // load first sub by default
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };

    fetchSubs();
  }, []);

  // Fetch Posts for Selected Topic
  useEffect(() => {
    const fetchPosts = async () => {
      if (!selectedSub) return;
      try {
        const res = await API.get(`/api/forum/subs/${selectedSub._id}/posts`);
        setPosts(res.data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, [selectedSub]);

  // Filter posts by selected topic (if any)
  const filteredPosts = selectedSub
    ? posts.filter((p) => p.sub === selectedSub._id)
    : posts;

  return (
    <div className="min-h-screen bg-alice mt-20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-caribbean">Forum</h1>
          <button
            onClick={() => navigate("/forum/create")}
            className="btn p-2 bg-caribbean text-white hover:bg-tufts"
          >
            New Post
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Forum Topics (Subs) */}
          <div className="md:col-span-1">
            <ForumTopics topics={subs} onSelectTopic={setSelectedSub} />
          </div>

          {/* Forum Posts */}
          <div className="md:col-span-2">
            <ForumList posts={filteredPosts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
