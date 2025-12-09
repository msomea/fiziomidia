import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";

const ForumTopics = ({ onSelectTopic }) => {
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [sortType, setSortType] = useState("alphabet");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  // NEW: Ref & height state
  const containerRef = useRef(null);
  const [minHeight, setMinHeight] = useState(null);

  const fetchSubs = async (pageNum = 1, limit) => {
    try {
      const res = await API.get(`/forum/subs?page=${pageNum}&limit=${limit}`);
      const data = res.data;

      setTopics(data.subs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(data.pagination?.page || 1);

      if ((data.subs || []).length > 0 && !activeTopic) {
        setActiveTopic(data.subs[0]._id);
        onSelectTopic(data.subs[0]);
      }
    } catch (err) {
      console.error("Error fetching forum topics:", err);
    }
  };

  useEffect(() => {
    fetchSubs(page, limit);
  }, [page]);

  // Calculate min height once topics are rendered
  useEffect(() => {
    if (containerRef.current) {
      const contentHeight = containerRef.current.offsetHeight;
      if (!minHeight || contentHeight > minHeight) {
        setMinHeight(contentHeight);
      }
    }
  }, [topics]);

  const sortedTopics = [...topics].sort((a, b) => {
    if (sortType === "alphabet") return a.title.localeCompare(b.title);
    if (sortType === "posts") return (b.totalPosts || 0) - (a.totalPosts || 0);
    return 0;
  });

  const handleTopicClick = (topic) => {
    setActiveTopic(topic._id);
    onSelectTopic(topic);
  };

  const handlePrev = () => page > 1 && setPage((prev) => prev - 1);
  const handleNext = () => page < totalPages && setPage((prev) => prev + 1);

  return (
    <div
      className="bg-white text-black shadow-md rounded-2xl p-4"
    >
      <div ref={containerRef} style={{ minHeight }}>
        {/* Header */}
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
                ${activeTopic === topic._id ? "bg-caribbean text-white" : ""}
                ${topic.isSponsored ? "border-l-4 border-yellow-400" : ""}`}
              onClick={() => handleTopicClick(topic)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2">
                  {topic.isSponsored
                    ? `${topic.sponsorName} - ${topic.title}`
                    : topic.title}
                </span>
                <span
                  className={`text-sm ${
                    activeTopic === topic._id ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {topic.totalPosts || 0} posts
                </span>
              </div>

              {topic.isSponsored && topic.sponsorWebsite && (
                <p className="text-xs text-black mt-1">
                  Sponsored by{" "}
                  <a
                    href={`https://${topic.sponsorWebsite}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-tufts underline"
                  >
                    {topic.sponsorName}
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>

        
      </div>
      {/* Pagination */}
        <div className="flex justify-between text-accent items-center mt-4">
          <button
            className="btn btn-sm bg-gray-200 border border-caribbean p-1"
            disabled={page <= 1}
            onClick={handlePrev}
          >
            <ArrowBigLeftIcon />
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-sm bg-gray-200 border border-caribbean p-1"
            disabled={page >= totalPages}
            onClick={handleNext}
          >
            <ArrowBigRightIcon />
          </button>
        </div>
    </div>
  );
};

export default ForumTopics;
