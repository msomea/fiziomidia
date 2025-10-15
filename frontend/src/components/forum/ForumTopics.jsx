import React, { useState } from "react";

const ForumTopics = ({ topics = [], onSelectTopic }) => {
  const [sortType, setSortType] = useState("alphabet");
  const [activeTopic, setActiveTopic] = useState(null);

  // Sort topics by title or by total posts (if available)
  const sortedTopics = [...topics].sort((a, b) => {
    if (sortType === "alphabet") return a.title.localeCompare(b.title);
    if (sortType === "posts") return (b.totalPosts || 0) - (a.totalPosts || 0);
    return 0;
  });

  const handleTopicClick = (topic) => {
    setActiveTopic(topic._id);
    onSelectTopic(topic); // Pass full topic object to parent
  };

  return (
    <div className="bg-white text-black shadow-md rounded-2xl p-4">
      {/* Header with Sorting */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-caribbean">Topics</h2>
        <fieldset className="fieldset w-24 text-white">
          <select
            className="select select-bordered select-sm text-black"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="alphabet">Alphabet</option>
            <option value="posts">Most Posts</option>
          </select>
        </fieldset>
      </div>

      {/* Topics List */}
      <ul className="space-y-2">
        {sortedTopics.length > 0 ? (
          sortedTopics.map((topic) => (
            <li
              key={topic._id}
              onClick={() => handleTopicClick(topic)}
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200
                ${activeTopic === topic._id ? "bg-caribbean text-white" : "hover:bg-alice"}`}
            >
              <span className="font-medium">{topic.title}</span>
              <span
                className={`text-sm ${
                  activeTopic === topic._id ? "text-white/80" : "text-gray-500"
                }`}
              >
                {topic.totalPosts || 0} posts
              </span>
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">No topics found.</p>
        )}
      </ul>
    </div>
  );
};

export default ForumTopics;
