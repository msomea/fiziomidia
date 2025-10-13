import React, { useState, useEffect } from "react";
import ForumTopics from "../components/forum/ForumTopics";
import ForumList from "../components/forum/ForumList";
import { useNavigate } from "react-router";

const Forum = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    // Simulate fetching topics
    setTopics([
      { _id: "1", name: "Rehab", totalPosts: 34 },
      { _id: "2", name: "Exercise", totalPosts: 21 },
      { _id: "3", name: "Nutrition", totalPosts: 45 },
      { _id: "4", name: "Injury Prevention", totalPosts: 12 },
    ]);

    // Simulate fetching posts
    setPosts([
      {
        _id: "p1",
        title: "Stretching for lower back pain",
        body: "Here is some content...",
        author: { name: "Dr. Jane Mwita", avatar: "/avatar.jpg" },
        timeAgo: "2 hours ago",
        upvotes: [1, 2],
        downvotes: [],
        comments: [1],
      },
      // Add more posts...
    ]);
  }, []);

  // Filter posts based on selected topic (for demo)
  const filteredPosts = selectedTopic
    ? posts.filter((p) => p.topicId === selectedTopic)
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
          <div className="md:col-span-1">
            <ForumTopics topics={topics} onSelectTopic={setSelectedTopic} />
          </div>
          <div className="md:col-span-2">
            <ForumList posts={filteredPosts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
