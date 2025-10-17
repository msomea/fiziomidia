import React, { useState } from "react";

const ForumTopics = ({ topics, onSelectTopic }) => {
  const [sortType, setSortType] = useState("alphabet");
  const [activeTopic, setActiveTopic] = useState(null);

  const sortedTopics = [...topics].sort((a, b) => {
    if (sortType === "alphabet") return a.title.localeCompare(b.title);
    if (sortType === "posts") return (b.totalPosts || 0) - (a.totalPosts || 0);
    return 0;
  });

  const handleTopicClick = (topic) => {
    setActiveTopic(topic._id);
    onSelectTopic(topic);
  };

  return (
    <div className="bg-white text-black shadow-md rounded-2xl p-4">
      {/* Header with Sorting */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-caribbean">Topics</h2>
        <fieldset className="fieldset w-24 text-white">
          <select
            className="select select-bordered select-sm"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="alphabet">Alphabet</option>
            <option value="posts">Most Posts</option>
          </select>
        </fieldset>
      </div>

      {/* Topics List */}
      <ul className="space-y-3">
        {sortedTopics.map((topic) => (
          <li
            key={topic._id}
            className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 border 
              ${activeTopic === topic._id ? "bg-caribbean text-white" : "hover:bg-alice"}`}
            onClick={() => handleTopicClick(topic)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium flex items-center gap-2">
                {topic.sponsor?.isActive && (
                  <img
                    src={topic.sponsor.logoUrl}
                    alt={topic.sponsor.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                {topic.sponsor?.isActive
                  ? `${topic.sponsor.name} ${topic.title}`
                  : topic.title}
              </span>
              <span className={`text-sm ${activeTopic === topic._id ? "text-white/80" : "text-gray-500"}`}>
                {topic.totalPosts || 0} posts
              </span>
            </div>
            {topic.sponsor?.isActive && (
              <p className="text-xs text-gray-400 mt-1">
                Sponsored by{" "}
                <a
                  href={topic.sponsor.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-caribbean underline"
                >
                  {topic.sponsor.name}
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ForumTopics;
