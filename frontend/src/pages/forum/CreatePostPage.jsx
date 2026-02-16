import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { X, Loader2, Search, ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import toast from "react-hot-toast";

const CreatePost = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Topics state
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  // Loading and submitting
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch topics with pagination & search
  const fetchTopics = async (pageNum = 1, searchTerm = "") => {
    setLoading(true);
    try {
      const res = await API.get(
        `${API_URL}/forum/subs?page=${pageNum}&limit=${limit}&search=${searchTerm}`
      );
      setTopics(res.data.subs || []);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err) {
      console.error("Error fetching topics:", err);
      toast.error(t("failed_load_topics"));
    } finally {
      setLoading(false);
    }
  };

  // Load topics initially and on search/page change
  useEffect(() => {
    fetchTopics(page, search);
  }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return toast.error(t("select_topic_error"));

    setSubmitting(true);
    try {
      await API.post(`${API_URL}/forum/posts`, {
        title,
        body,
        sub: selectedTopic._id,
      });
      toast.success(t("post_created_success"));
      navigate("/forum");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(t("post_create_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => page > 1 && setPage((prev) => prev - 1);
  const handleNext = () => page < totalPages && setPage((prev) => prev + 1);

  return (
    <div className="min-h-screen bg-alice p-6 mt-20">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold text-caribbean">{t("create_post")}</h2>
          <button onClick={() => navigate(-1)}>
            <X className="text-red-500 hover:text-red-800" />
          </button>
        </div>

        {/* Search + Topics List */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Search className="text-gray-400" />
            <input
              type="text"
              placeholder={t("search_topic")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 flex-1 focus:ring-2 focus:ring-caribbean"
            />
          </div>

          {loading ? (
            <div className="h-32 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
              <p className="mt-4 text-caribbean font-medium animate-pulse">
                {t("loading_topics")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {topics.map((topic) => (
                <li
                  key={topic._id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedTopic?._id === topic._id
                      ? "bg-caribbean text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center text-tufts">
                    <span>{topic.title}</span>
                    <span className="text-sm">{topic.totalPosts || 0} {t("posts")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              className="btn btn-sm text-accent border border-caribbean"
              disabled={page <= 1}
              onClick={handlePrev}
            >
              <ArrowBigLeftIcon />
            </button>
            <span className="text-sm text-gray-600">
              {t("page")} {page} {t("of")} {totalPages}
            </span>
            <button
              className="btn btn-sm text-accent border border-caribbean"
              disabled={page >= totalPages}
              onClick={handleNext}
            >
              <ArrowBigRightIcon />
            </button>
          </div>
        </div>

        {/* Post Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t("post_title")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-caribbean"
          />
          <textarea
            placeholder={t("post_body")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="6"
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-caribbean"
          ></textarea>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-caribbean text-white py-2 rounded-lg hover:bg-tufts transition"
          >
            {submitting ? t("posting") : t("publish_post")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
