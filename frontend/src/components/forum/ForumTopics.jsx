import React, { useState, useEffect } from "react";
import API from "../../api/axios";

const ForumTopics = ({ onSelectTopic }) => {
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [sortType, setSortType] = useState("alphabet");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  // Fetch subs from backend
  const fetchSubs = async (pageNum = 1) => {
    try {
      const res = await API.get(`/forum/subs?page=${pageNum}&limit=${limit}`);
      setTopics(res.data.subs || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);

      if ((res.data.subs || []).length > 0 && !activeTopic) {
        setActiveTopic(res.data.subs[0]._id);
        onSelectTopic(res.data.subs[0]);
      }
    } catch (err) {
      console.error("Error fetching forum topics:", err);
    }
  };

  useEffect(() => {
    fetchSubs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedTopics = [...topics].sort((a, b) => {
    if (sortType === "alphabet") return a.title.localeCompare(b.title);
    if (sortType === "posts") return (b.totalPosts || 0) - (a.totalPosts || 0);
    return 0;
  });

  const handleTopicClick = (topic) => {
    setActiveTopic(topic._id);
    onSelectTopic(topic);
  };

  const handlePrev = () => {
    if (page > 1) fetchSubs(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) fetchSubs(page + 1);
  };

  return (
    <div className="bg-white text-black shadow-md rounded-2xl p-4">
      {/* Header with Sorting */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-caribbean">Topics</h2>
        <fieldset className="fieldset w-32 p-1 text-white">
          <select
            className="select p-1 bg-gray-500 select-bordered select-sm"
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

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="btn btn-sm border border-red-50"
          disabled={page <= 1}
          onClick={handlePrev}
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
        <button
          className="btn btn-sm"
          disabled={page >= totalPages}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ForumTopics;
