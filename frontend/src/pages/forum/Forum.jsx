import React, { useEffect, useState } from "react";
import ForumTopics from "../../components/forum/ForumTopics";
import ForumList from "../../components/forum/ForumList";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useForum } from "../../context/ForumContext";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import CollapsibleSection from "../../components/admin/CollapsibleSection";
import { Plus, Trash2 } from "lucide-react";
import { socket } from "../../socket";
import { useTranslation } from "react-i18next";
import ProfileBadge from "../../components/Badge.jsx";

const Forum = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const fallbackLang = "en";
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    posts,
    setPosts,
    fetchForumPageData,
    fetchSub,
    selectedSub,
    setSelectedSub,
    loadingPosts,
    userPermissions,
    refreshPosts
  } = useForum();

  const [requesting, setRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [alreadyMod, setAlreadyMod] = useState(false);
  const [isOwnerFromAPI, setIsOwnerFromAPI] = useState(false);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [rulesDraft, setRulesDraft] = useState([]);

  useEffect(() => {
    setRulesDraft(
      (selectedSub?.rules || []).map((r) => ({
        en: r.en || "",
        sw: r.sw || "",
        _id: r._id || null,
      }))
    );
  }, [selectedSub]);

  // Sync user permissions with local state
  useEffect(() => {
    setHasRequested(userPermissions?.hasPendingRequest || false);
  }, [userPermissions]);

  // Check mod request status when subforum changes
  useEffect(() => {
    if (selectedSub && user?.role === "physiotherapist") {
      checkModRequestStatus(selectedSub._id);
    }
  }, [selectedSub, user]);

  /* ------------------ Permissions ------------------ */
  const isMod = userPermissions?.isMod || (user?._id && selectedSub?.moderators?.some(
    (m) => (m.user?._id?.toString() === user._id.toString() || m.user?.toString() === user._id.toString()) && m.role === "mod"
  ));

  const ownerId =
    selectedSub?.createdBy?._id?.toString() || selectedSub?.createdBy?.toString();
  const isOwner = user?._id && ownerId === user._id.toString();

  const canEditRules =
    user &&
    user._id &&
    selectedSub &&
    (user.role === "admin" || isMod || isOwner);

  /* ------------------ Handlers ------------------ */
  const handleSelectTopic = async (topic) => {
    // 🚀 Use the new consolidated API call
    await fetchForumPageData(topic._id);
  };

  const handleAddRule = () => setRulesDraft((prev) => [...prev, ""]);
  const handleRemoveRule = (index) =>
    setRulesDraft((prev) => prev.filter((_, i) => i !== index));

  const handleSaveRules = async () => {
    const cleanedRules = rulesDraft
      .map((r) => ({
        en: r.en.trim(),
        sw: r.sw.trim(),
      }))
      .filter((r) => r.en || r.sw); // remove empty rules

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
  // Note: This function is kept for individual mod requests, but checkModRequestStatus
  // is now handled automatically by fetchForumPageData
  const checkModRequestStatus = async (subId) => {
    if (!user || !user._id || user.role !== "physiotherapist") return;

    try {
      const res = await API.get(`${API_URL}/forum/subs/${subId}/my-mod-request`);
      // Set hasRequested to true if user has pending request OR is already a mod
      setHasRequested(res.data.requested || res.data.alreadyMod || false);
      setAlreadyMod(res.data.alreadyMod || false);
      setIsOwnerFromAPI(res.data.isOwner || false);
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
        // Refresh the forum page data to get updated permissions
        await fetchForumPageData(selectedSub._id);
        // Also check mod status to be thorough
        await checkModRequestStatus(selectedSub._id);
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
    user &&
    user._id &&
    user.role === "physiotherapist" &&
    selectedSub &&
    !userPermissions?.isMod &&
    !isMod &&  // Double-check with local moderator calculation
    !alreadyMod &&  // Check if already a mod via API
    !userPermissions?.isOwner &&
    !isOwner &&  // Double-check with local calculation
    !isOwnerFromAPI &&  // Check if owner via API
    !userPermissions?.hasPendingRequest;

  
  /* ------------------ Pin Logic ------------------ */
  const togglePin = async (postId, pinned) => {
    try {
      const res = await API.put(`${API_URL}/forum/posts/${postId}/pin`, {
        pinned: !pinned,
      });

      if (res.data.success) {
        toast.success(!pinned ? t("post_pinned") : t("post_unpinned"));
        // Refresh posts to get updated pinned status
        await refreshPosts(selectedSub._id);
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
console.log(selectedSub)
  /* ------------------ Render ------------------ */
  return (
    <div className="min-h-screen bg-alice mt-20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-caribbean">{t("forum")}</h1>

          {/* Later allow only PT and Admin to post */}
          <div className="flex gap-2">
            {user && user._id && ["physiotherapist","member", "pendingPhysiotherapist", "admin"].includes(user.role) && (
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
                        <li key={i}>
                          {rule[currentLang] || rule[fallbackLang]}
                        </li>
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
                    <div className="space-y-3">
                      {rulesDraft.map((rule, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder={`Rule #${i + 1} (EN)`}
                            value={rule.en}
                            onChange={(e) => {
                              const updated = [...rulesDraft];
                              updated[i].en = e.target.value;
                              setRulesDraft(updated);
                            }}
                            className="border rounded px-2 py-1 text-sm w-full"
                          />
                          <input
                            type="text"
                            placeholder={`Rule #${i + 1} (SW)`}
                            value={rule.sw}
                            onChange={(e) => {
                              const updated = [...rulesDraft];
                              updated[i].sw = e.target.value;
                              setRulesDraft(updated);
                            }}
                            className="border rounded px-2 py-1 text-sm w-full"
                          />
                          <button
                            onClick={() => handleRemoveRule(i)}
                            className="text-red-500 text-xs self-start"
                          >
                            <Trash2 size={16} /> Remove
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

            {selectedSub && (
              <CollapsibleSection title={t("moderation_team")}>
                <div className="space-y-4">
                  {/* Sub Owner */}
                  {selectedSub.createdBy && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-tufts text-sm">{t("sub_owner")}:</span>
                      <Link
                        to={
                          selectedSub.createdBy.role === "physiotherapist"
                            ? `/profile/pt/${selectedSub.createdBy._id}`
                            : `/profile/member/${selectedSub.createdBy._id}`
                        }
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        <span className="font-medium text-black">
                          {selectedSub.createdBy.fullName}
                        </span>
                        <ProfileBadge role={selectedSub.createdBy.role} showTooltip={false} />
                      </Link>
                    </div>
                  )}

                  {/* Moderators */}
                  {selectedSub.moderators && selectedSub.moderators.length > 0 && (
                    <div>
                      <span className="font-semibold text-tufts text-sm block mb-2">
                        {t("moderators")} ({selectedSub.moderators.length}):
                      </span>
                      <div className="space-y-2">
                        {selectedSub.moderators.map((mod, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {mod.role === "mod" ? t("moderator") : t("sub_moderator")}:
                            </span>
                            {mod.user && (
                              <Link
                                to={
                                  mod.user.role === "physiotherapist"
                                    ? `/profile/pt/${mod.user._id}`
                                    : `/profile/member/${mod.user._id}`
                                }
                                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                              >
                                <span className="font-medium text-black text-sm">
                                  {mod.user.fullName}
                                </span>
                                <ProfileBadge role={mod.user.role} showTooltip={false} />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No moderators message */}
                  {(!selectedSub.moderators || selectedSub.moderators.length === 0) && (
                    <p className="text-gray-500 text-sm italic">
                      {t("no_moderators_yet")}
                    </p>
                  )}
                </div>
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
