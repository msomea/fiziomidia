import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { X, Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePTSubmanagement, PTSubmanagementProvider } from "../../contexts/PTSubmanagementContext";

function PTSubManagementContent() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const fallbackLang = "en";

  const { subId } = useParams();
  const navigate = useNavigate();
  
  // 🚀 Use consolidated context instead of local state
  const {
    subforum,
    modRequests,
    userPermissions,
    loading,
    activeTab,
    canManage,
    fetchSubmanagementData,
    refreshModRequests,
    updateSubforum,
    updateModRequest,
    handleTabChange,
  } = usePTSubmanagement();

  // Local form state
  const [titleEn, setTitleEn] = useState("");
  const [titleSw, setTitleSw] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descSw, setDescSw] = useState("");
  const [rulesDraft, setRulesDraft] = useState([]); // array of {en, sw}

  // Initialize form data when subforum loads
  useEffect(() => {
    if (subforum) {
      setTitleEn(subforum.title?.en || "");
      setTitleSw(subforum.title?.sw || "");
      setDescEn(subforum.description?.en || "");
      setDescSw(subforum.description?.sw || "");
      setRulesDraft(
        (subforum.rules || []).map((r) => ({ en: r.en || "", sw: r.sw || "" }))
      );
    }
  }, [subforum]);

  // Initial data fetch
  useEffect(() => {
    if (subId) {
      fetchSubmanagementData(subId);
    }
  }, [subId, fetchSubmanagementData]);

  // Handle tab changes
  useEffect(() => {
    if (subId && activeTab) {
      refreshModRequests(subId, activeTab);
    }
  }, [subId, activeTab, refreshModRequests]);

  /* ---------------- SUB UPDATE ---------------- */
  const handleUpdateSub = async (e) => {
    e.preventDefault();

    // Validate at least one lang for title/description and rules
    if (!titleEn.trim() && !titleSw.trim()) {
      return toast.error(t("title_required_en_sw"));
    }

    if (!descEn.trim() && !descSw.trim()) {
      return toast.error(t("description_required_en_sw"));
    }

    const cleanedRules = rulesDraft
      .map((r) => ({ en: r.en.trim(), sw: r.sw.trim() }))
      .filter((r) => r.en || r.sw);

    if (cleanedRules.length === 0) {
      return toast.error(t("at_least_one_rule_required"));
    }

    try {
      const payload = {
        title: { en: titleEn, sw: titleSw },
        description: { en: descEn, sw: descSw },
        rules: cleanedRules,
      };

      // 🚀 Use context function instead of direct API call
      const updatedSub = await updateSubforum(subId, payload);
      
      if (updatedSub) {
        // Form data will be updated automatically via useEffect
      }
    } catch (err) {
      console.error(err);
      // Error handling is done in context
    }
  };

  /* ---------------- MOD REQUEST UPDATE ---------------- */
  const handleUpdateRequest = async (requestId, role) => {
    // 🚀 Use context function instead of direct API call
    await updateModRequest(subId, requestId, role);
  };

  /* ---------------- RULE HANDLERS ---------------- */
  const handleRuleChange = (index, field, value) => {
    const updated = [...rulesDraft];
    updated[index][field] = value;
    setRulesDraft(updated);
  };

  const handleAddRule = () => setRulesDraft([...rulesDraft, { en: "", sw: "" }]);
  const handleRemoveRule = (index) =>
    setRulesDraft(rulesDraft.filter((_, i) => i !== index));

  if (loading) return <p>{t("loading")}...</p>;
  if (!subforum) return <p>{t("sub_not_found")}</p>;

  return (
    <div className="p-4 space-y-8 mt-20">
      <div className="flex justify-between mb-3">
        <h1 className="text-2xl text-caribbean font-bold">
          {t("manage_sub")}: {subforum.title[currentLang] || subforum.title[fallbackLang]}
        </h1>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-800" />
        </button>
      </div>

      {/* ---------- SUB INFO FORM ---------- */}
      <form
        onSubmit={handleUpdateSub}
        className="bg-white p-4 rounded shadow space-y-4"
      >
        <h2 className="font-semibold text-caribbean text-lg">
          {t("edit_sub_info")}
        </h2>

        {/* Titles */}
        <div className="flex flex-col md:flex-row gap-2">
          <input
            className="w-full border p-2 rounded"
            placeholder={t("title_en")}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            placeholder={t("title_sw")}
            value={titleSw}
            onChange={(e) => setTitleSw(e.target.value)}
          />
        </div>

        {/* Descriptions */}
        <div className="flex flex-col md:flex-row gap-2">
          <textarea
            className="w-full border p-2 rounded"
            placeholder={t("description_en")}
            rows={3}
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder={t("description_sw")}
            rows={3}
            value={descSw}
            onChange={(e) => setDescSw(e.target.value)}
          />
        </div>

        {/* Rules */}
        <div className="space-y-2">
          <label className="font-medium">{t("rules")}:</label>
          {rulesDraft.map((r, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-2">
              <input
                className="border p-2 rounded w-full"
                placeholder={`${t("rule_en")} #${i + 1}`}
                value={r.en}
                onChange={(e) => handleRuleChange(i, "en", e.target.value)}
              />
              <input
                className="border p-2 rounded w-full"
                placeholder={`${t("rule_sw")} #${i + 1}`}
                value={r.sw}
                onChange={(e) => handleRuleChange(i, "sw", e.target.value)}
              />
              <div className="flex gap-1 mt-1 md:mt-0">
                <button
                  type="button"
                  onClick={() => handleRemoveRule(i)}
                  className="text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddRule}
            className="flex items-center gap-1 text-green-600 mt-2"
          >
            <Plus size={14} /> {t("add_rule")}
          </button>
        </div>

        <button className="bg-tufts text-white px-4 py-2 rounded mt-3">
          {t("save_changes")}
        </button>
      </form>

      {/* ---------- MODERATOR REQUESTS ---------- */}
      <div className="bg-white p-4 text-caribbean rounded shadow">
        <h2 className="font-semibold text-lg mb-3">
          {t("moderator_requests")}
        </h2>

        {/* STATUS TABS */}
        <div className="flex gap-2 mb-4">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => handleTabChange(s)}
              className={`px-3 py-1 rounded ${
                activeTab === s ? "bg-tufts text-white" : "bg-gray-200"
              }`}
            >
              {t(`status_${s}`)}
            </button>
          ))}
        </div>

        {/* REQUEST LIST */}
        {modRequests.length ? (
          <ul className="space-y-3">
            {modRequests.map((r) => (
              <li
                key={r._id}
                className="flex justify-between items-center border p-3 rounded"
              >
                <div>
                  <p className="font-medium">{r.user.fullName}</p>
                  <p className="text-sm text-gray-500">
                    {t("current_role")}: {t(`role_${r.role}`)}
                  </p>
                </div>

                <select
                  key={`${r._id}-${r.role}-${r.status}`}
                  className="border p-2 rounded"
                  defaultValue=""
                  onChange={(e) => handleUpdateRequest(r._id, e.target.value)}
                >
                  <option value="" disabled>
                    {t("change_role")}
                  </option>

                  {r.status !== "approved" && (
                    <>
                      <option value="sub_mod">{t("approve_as_sub_mod")}</option>
                      <option value="mod">{t("approve_as_mod")}</option>
                    </>
                  )}

                  {r.status === "approved" && r.role === "sub_mod" && (
                    <>
                      <option value="mod">{t("upgrade_to_mod")}</option>
                      <option value="member">{t("remove_mod")}</option>
                    </>
                  )}

                  {r.status === "approved" && r.role === "mod" && (
                    <>
                      <option value="sub_mod">{t("downgrade_to_sub_mod")}</option>
                      <option value="member">{t("remove_mod")}</option>
                    </>
                  )}
                </select>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("no_requests", { status: t(`status_${activeTab}`) })}</p>
        )}
      </div>
    </div>
  );
}

export default function PTSubManagementPage() {
  return (
    <PTSubmanagementProvider>
      <PTSubManagementContent />
    </PTSubmanagementProvider>
  );
}