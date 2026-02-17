import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";
import CollapsibleSection from "../admin/CollapsibleSection";
import { useTranslation } from "react-i18next";

const ForumTopics = ({ onSelectTopic, user, socket }) => {
  const { t } = useTranslation();

  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [sortType, setSortType] = useState("alphabet");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const containerRef = useRef(null);
  const [minHeight, setMinHeight] = useState(null);

  const [showAddSub, setShowAddSub] = useState(false);
  const [newSub, setNewSub] = useState({
    title: "",
    slug: "",
    description: "",
    rules: [""],
  });
  const [subSaving, setSubSaving] = useState(false);

  const fetchSubs = async (pageNum = 1, limit) => {
    try {
      const res = await API.get(
        `${API_URL}/forum/subs?page=${pageNum}&limit=${limit}`
      );
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
      toast.error(t("failed_load_topics"));
    }
  };

  useEffect(() => {
    fetchSubs(page, limit);
  }, [page]);

  useEffect(() => {
    if (!socket) return;

    socket.on("post:created", () => fetchSubs(page, limit));
    socket.on("post:deleted", () => fetchSubs(page, limit));

    return () => {
      socket.off("post:created");
      socket.off("post:deleted");
    };
  }, [socket, page, limit]);

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
    if (sortType === "posts")
      return (b.totalPosts || 0) - (a.totalPosts || 0);
    return 0;
  });

  const handleTopicClick = (topic) => {
    setActiveTopic(topic._id);
    onSelectTopic(topic);
  };

  const handleRuleChange = (index, value) => {
    const updatedRules = [...newSub.rules];
    updatedRules[index] = value;
    setNewSub({ ...newSub, rules: updatedRules });
  };

  const addRuleField = () => {
    setNewSub({ ...newSub, rules: [...newSub.rules, ""] });
  };

  const removeRuleField = (index) => {
    const updatedRules = newSub.rules.filter((_, i) => i !== index);
    setNewSub({ ...newSub, rules: updatedRules });
  };

  const saveNewSub = async () => {
    if (!newSub.title || !newSub.slug) {
      toast.error(t("title_slug_required"));
      return;
    }

    setSubSaving(true);
    try {
      const res = await API.post(`${API_URL}/forum/subs`, newSub);
      if (res.data.sub) {
        toast.success(t("topic_created_success"));
        setShowAddSub(false);
        setNewSub({
          title: "",
          slug: "",
          description: "",
          rules: [""],
        });
        fetchSubs(page, limit);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("failed_create_topic"));
    } finally {
      setSubSaving(false);
    }
  };

  const canAddSub =
    user && (user.role === "physiotherapist" || user.role === "admin");

  return (
    <div className="bg-white text-black shadow-md rounded-2xl p-4">
      <div ref={containerRef} style={{ minHeight }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-caribbean">
            {t("forum_topics")}
          </h2>

          <fieldset className="fieldset w-32 p-1 text-white">
            <select
              className="select p-1 bg-gray-500 select-bordered select-sm"
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
            >
              <option value="alphabet">{t("sort_alphabet")}</option>
              <option value="posts">{t("sort_most_posts")}</option>
            </select>
          </fieldset>
        </div>

        {/* Add Topic Button */}
        {canAddSub && (
          <div className="mb-4">
            <button
              className="btn bg-green-600 text-white hover:bg-green-800 p-2 rounded"
              onClick={() => setShowAddSub(!showAddSub)}
            >
              {showAddSub
                ? t("cancel")
                : t("add_new_topic")}
            </button>
          </div>
        )}

        {/* Add Topic Form */}
        {showAddSub && (
          <CollapsibleSection
            title={t("create_new_forum_topic")}
            isOpen
          >
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder={t("title")}
                className="border p-2 rounded w-full"
                value={newSub.title}
                onChange={(e) =>
                  setNewSub({ ...newSub, title: e.target.value })
                }
              />

              <input
                type="text"
                placeholder={t("slug_placeholder")}
                className="border p-2 rounded w-full"
                value={newSub.slug}
                onChange={(e) =>
                  setNewSub({ ...newSub, slug: e.target.value })
                }
              />

              <textarea
                rows={3}
                placeholder={t("description")}
                className="border p-2 rounded w-full"
                value={newSub.description}
                onChange={(e) =>
                  setNewSub({
                    ...newSub,
                    description: e.target.value,
                  })
                }
              />

              {/* Rules */}
              <CollapsibleSection
                title={t("topic_rules")}
                isOpen
              >
                {newSub.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 items-center mt-2"
                  >
                    <input
                      type="text"
                      placeholder={`${t("rule")} #${idx + 1}`}
                      className="border p-2 rounded flex-1"
                      value={rule}
                      onChange={(e) =>
                        handleRuleChange(idx, e.target.value)
                      }
                    />

                    {newSub.rules.length > 1 && (
                      <button
                        className="btn bg-red-600 text-white p-1 rounded"
                        onClick={() =>
                          removeRuleField(idx)
                        }
                      >
                        {t("remove")}
                      </button>
                    )}
                  </div>
                ))}

                <button
                  className="btn bg-blue-600 text-white p-2 rounded mt-2"
                  onClick={addRuleField}
                >
                  {t("add_rule")}
                </button>
              </CollapsibleSection>

              <button
                className="btn bg-caribbean text-white p-2 rounded mt-3"
                onClick={saveNewSub}
                disabled={subSaving}
              >
                {subSaving
                  ? t("saving")
                  : t("save_topic")}
              </button>
            </div>
          </CollapsibleSection>
        )}

        {/* Topics List */}
        <ul className="space-y-3 mt-4">
          {sortedTopics.map((topic) => (
            <li
              key={topic._id}
              className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 border
                ${activeTopic === topic._id ? "bg-caribbean text-white" : ""}
                ${topic.isSponsored ? "border-l-4 border-yellow-400" : ""}`}
              onClick={() => handleTopicClick(topic)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {topic.isSponsored
                    ? `${topic.sponsorName} - ${topic.title}`
                    : topic.title}
                </span>

                <span
                  className={`text-sm ${
                    activeTopic === topic._id
                      ? "text-white/80"
                      : "text-gray-500"
                  }`}
                >
                  {topic.totalPosts ?? 0}{" "}
                  {Number(topic.totalPosts) === 1
                    ? t("post_singular")
                    : t("post_plural")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      <div className="flex justify-between text-accent items-center mt-4">
        <button
          className="btn btn-sm bg-gray-200 border border-caribbean p-1"
          disabled={page <= 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          <ArrowBigLeftIcon />
        </button>

        <span className="text-sm text-gray-500">
          {t("page")} {page} {t("ofto")} {totalPages}
        </span>

        <button
          className="btn btn-sm bg-gray-200 border border-caribbean p-1"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          <ArrowBigRightIcon />
        </button>
      </div>
    </div>
  );
};

export default ForumTopics;
