import React, { useEffect, useState } from "react";
import ForumTopics from "../../components/forum/ForumTopics";
import ForumList from "../../components/forum/ForumList";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useForum } from "../../context/ForumContext";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import CollapsibleSection from "../../components/admin/CollapsibleSection";
import { Plus, Trash2 } from "lucide-react";
import { socket } from "../../socket";
import { useTranslation } from "react-i18next";

const Forum = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    posts,
    setPosts,
    fetchPosts,
    fetchSub,
    selectedSub,
    setSelectedSub,
    loadingPosts,
  } = useForum();

  const [requesting, setRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [rulesDraft, setRulesDraft] = useState([]);

  useEffect(() => {
    setRulesDraft(selectedSub?.rules || []);
  }, [selectedSub]);

  /* ------------------ Permissions ------------------ */
  const isMod = selectedSub?.moderators?.some(
    (m) => m.user?.toString() === user._id && m.role === "mod"
  );
  const isOwner = selectedSub?.createdBy?.toString() === user._id;
  const canEditRules =
    user &&
    selectedSub &&
    (user.role === "admin" || isMod || isOwner);

  /* ------------------ Handlers ------------------ */
  const handleSelectTopic = async (topic) => {
    await fetchSub(topic._id);
    await fetchPosts(topic._id);
    await checkModRequestStatus(topic._id);
  };

  const handleAddRule = () => setRulesDraft((prev) => [...prev, ""]);
  const handleRemoveRule = (index) =>
    setRulesDraft((prev) => prev.filter((_, i) => i !== index));

  const handleSaveRules = async () => {
    const cleanedRules = rulesDraft.map((r) => r.trim()).filter(Boolean);

    try {
      const res = await API.put(`${API_URL}/forum/subs/${selectedSub._id}`, {
        rules: cleanedRules,
      });

      if (!res?.data.success) throw new Error(t("update_failed"));

      setSelectedSub((prev) => ({ ...prev, rules: cleanedRules }));
      toast.success(t("rules_updated"));
      setIsEditingRules(false);
    } catch (err) {
      console.error("Rules update error:", err);
      toast.error(t("rules_update_failed"));
    }
  };

  /* ------------------ Moderator Request ------------------ */
  const checkModRequestStatus = async (subId) => {
    if (!user || user.role !== "physiotherapist") return;

    try {
      const res = await API.get(`${API_URL}/forum/subs/${subId}/my-mod-request`);
      setHasRequested(res.data.requested || res.data.alreadyMod || false);
    } catch (err) {
      console.error("Failed to check mod request:", err);
    }
  };

  const requestModerator = async () => {
    if (!selectedSub) return;
    setRequesting(true);

    try {
      const res = await API.post(`${API_URL}/forum/subs/${selectedSub._id}/mod-requests`);

      if (res.data.success) {
        toast.success(t("moderator_request_sent"));
        setHasRequested(true);
        await fetchSub(selectedSub._id);
      } else {
        toast.error(res.data.error || t("request_failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("request_failed"));
    } finally {
      setRequesting(false);
    }
  };

  const showRequestButton =
    user?.role === "physiotherapist" &&
    selectedSub &&
    !selectedSub.moderators?.some((m) => m.user?.toString() === user._id) &&
    selectedSub.createdBy?.toString() !== user._id &&
    !hasRequested;

  /* ------------------ Pin Logic ------------------ */
  const togglePin = async (postId, pinned) => {
    try {
      const res = await API.put(`${API_URL}/forum/posts/${postId}/pin`, {
        pinned: !pinned,
      });

      if (res.data.success) {
        toast.success(!pinned ? t("post_pinned") : t("post_unpinned"));
        await fetchPosts(selectedSub._id);
      } else {
        toast.error(res.data.error || t("update_failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("update_failed"));
    }
  };

  const sortedPosts = () => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
      if (a.sub?.isSponsored && !b.sub?.isSponsored) return -1;
      if (!a.sub?.isSponsored && b.sub?.isSponsored) return 1;
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  /* ------------------ Render ------------------ */
  return (
    <div className="min-h-screen bg-alice mt-20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-caribbean">{t("forum")}</h1>

          <div className="flex gap-2">
            {["physiotherapist", "admin"].includes(user.role) && (
              <button
                onClick={() => navigate("/forum/create")}
                className="btn p-2 bg-caribbean text-white"
              >
                {t("new_post")}
              </button>
            )}

            {showRequestButton && (
              <button
                onClick={requestModerator}
                disabled={requesting || hasRequested}
                className={`btn p-2 text-white ${
                  hasRequested
                    ? "bg-gray-400"
                    : "bg-green-600 hover:bg-green-800"
                }`}
              >
                {hasRequested
                  ? t("request_sent")
                  : t("request_moderator")}
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <ForumTopics onSelectTopic={handleSelectTopic} user={user} socket={socket} />
          </div>

          <div className="md:col-span-2 space-y-4">
            {selectedSub && (
              <CollapsibleSection title={t("sub_rules")}>
                {!isEditingRules ? (
                  <>
                    <ul className="text-tufts list-inside text-sm">
                      {selectedSub.rules?.map((rule, i) => (
                        <li key={i}>{rule}</li>
                      ))}
                    </ul>

                    {canEditRules && (
                      <button
                        onClick={() => setIsEditingRules(true)}
                        className="mt-2 text-xs text-tufts"
                      >
                        {t("edit_rules")}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      {rulesDraft.map((rule, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={rule}
                            onChange={(e) => {
                              const updated = [...rulesDraft];
                              updated[i] = e.target.value;
                              setRulesDraft(updated);
                            }}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                          />
                          <button
                            onClick={() => handleRemoveRule(i)}
                            className="text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleAddRule}
                      className="flex items-center gap-1 text-xs text-green-600 mt-2"
                    >
                      <Plus size={14} /> {t("add_rule")}
                    </button>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveRules}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        {t("save")}
                      </button>
                      <button
                        onClick={() => {
                          setRulesDraft(selectedSub.rules || []);
                          setIsEditingRules(false);
                        }}
                        className="bg-red-400 px-3 py-1 text-white rounded text-xs"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </>
                )}
              </CollapsibleSection>
            )}

            <ForumList
              user={user}
              posts={sortedPosts()}
              loading={loadingPosts || !selectedSub}
              currentTopic={selectedSub}
              onTogglePin={togglePin}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
