import React, { useState } from "react";

const ForumTopics = ({ topics, onSelectTopic }) => {
  const [sortType, setSortType] = useState("alphabet"); // or "posts"
  const [activeTopic, setActiveTopic] = useState(null);

  // Sort topics
  const sortedTopics = [...topics].sort((a, b) => {
    if (sortType === "alphabet") return a.name.localeCompare(b.name);
    if (sortType === "posts") return b.totalPosts - a.totalPosts;
    return 0;
  });

  const handleTopicClick = (topicId) => {
    setActiveTopic(topicId);
    onSelectTopic(topicId);
  };

  return (
    <div className="bg-white text-black shadow-md rounded-2xl p-4">
      {/* Header with Sorting */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-caribbean">Topics</h2>
        <fieldset className="fieldset w-20 text-white">
            <select
            className="select"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            >
                <option>Alphabet</option>
                <option>Most Post</option>
            </select>
        </fieldset>

      </div>

      {/* Topics List */}
      <ul className="space-y-2">
        {sortedTopics.map((topic) => (
          <li
            key={topic._id}
            className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200
              ${activeTopic === topic._id ? "bg-caribbean text-white" : "hover:bg-alice"}`}
            onClick={() => handleTopicClick(topic._id)}
          >
            <span className="font-medium">{topic.name}</span>
            <span className={`text-sm ${activeTopic === topic._id ? "text-white/80" : "text-gray-500"}`}>
              {topic.totalPosts} posts
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ForumTopics;
