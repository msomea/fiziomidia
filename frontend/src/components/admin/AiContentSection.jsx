import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  RefreshCw,
  CalendarClock,
  FileText,
  Pencil,
  Check,
  X,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import {
  getAIConfig,
  updateAIConfig,
  listGeneratedContent,
  reviewGeneratedContent,
  triggerForumDraft,
} from "../../api/ai";
import { fetchForumSubs } from "../../api/forum";

const DAYS = [
  { value: "daily", labelKey: "ai_day_daily" },
  { value: "1", labelKey: "ai_day_mon" },
  { value: "2", labelKey: "ai_day_tue" },
  { value: "3", labelKey: "ai_day_wed" },
  { value: "4", labelKey: "ai_day_thu" },
  { value: "5", labelKey: "ai_day_fri" },
  { value: "6", labelKey: "ai_day_sat" },
  { value: "0", labelKey: "ai_day_sun" },
];

const statusBadge = (status) => {
  const map = {
    pending_review: "badge-warning",
    approved: "badge-success",
    published: "badge-success",
    rejected: "badge-error",
    regeneration_requested: "badge-info",
    draft: "badge-ghost",
  };
  return map[status] || "badge-ghost";
};

// Parse "M H * * D" cron → { day, time }
const parseSchedule = (cron) => {
  if (!cron) return { day: "daily", time: "08:00" };
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return { day: "daily", time: "08:00" };
  const [min, hour, , , dow] = parts;
  const day = dow === "*" ? "daily" : dow;
  const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  return { day, time };
};

// ForumSub.title is localized {en, sw} — pick display string
const subTitle = (s) => {
  if (!s) return "—";
  if (typeof s.title === "string") return s.title;
  return s.title?.sw || s.title?.en || s.name || "—";
};

const buildCron = (day, time) => {
  const [hour, min] = time.split(":");
  return `${parseInt(min, 10)} ${parseInt(hour, 10)} * * ${day === "daily" ? "*" : day}`;
};

export default function AiContentSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [subs, setSubs] = useState([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [day, setDay] = useState("daily");
  const [time, setTime] = useState("08:00");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [selectedSub, setSelectedSub] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cfgRes, contentRes, subsRes] = await Promise.all([
        getAIConfig(),
        listGeneratedContent({ agent: "forumContent", limit: 50 }),
        fetchForumSubs(),
      ]);
      const agentCfg = cfgRes.config?.agents?.find((a) => a.name === "forumContent");
      const parsed = parseSchedule(agentCfg?.schedule);
      setScheduleEnabled(Boolean(agentCfg?.schedule));
      setDay(parsed.day);
      setTime(parsed.time);
      setItems(contentRes.items || []);
      const subList = Array.isArray(subsRes) ? subsRes : subsRes?.subs || subsRes?.data || [];
      setSubs(subList);
      if (subList.length && !selectedSub) setSelectedSub(String(subList[0]._id || subList[0].id));
    } catch (err) {
      toast.error(err.response?.data?.error || t("ai_load_error"));
    } finally {
      setLoading(false);
    }
  }, [t, selectedSub]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSchedule = async () => {
    try {
      setSavingSchedule(true);
      await updateAIConfig({
        agents: [
          {
            name: "forumContent",
            schedule: scheduleEnabled ? buildCron(day, time) : null,
          },
        ],
      });
      toast.success(t("ai_schedule_saved"));
      toast(t("ai_schedule_restart_note"), { icon: "ℹ️" });
    } catch (err) {
      toast.error(err.response?.data?.error || t("ai_save_error"));
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSub) return toast.error(t("ai_select_sub"));
    try {
      setGenerating(true);
      await triggerForumDraft(selectedSub);
      toast.success(t("ai_draft_generated"));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || t("ai_generate_error"));
    } finally {
      setGenerating(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditTitle(item.title);
    setEditBody(item.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  };

  const handleReview = async (item, action) => {
    try {
      setBusyId(item._id);
      const payload = { action };
      if (action === "approve" && editingId === item._id) {
        payload.title = editTitle;
        payload.body = editBody;
      }
      if (action === "reject") {
        const notes = window.prompt(t("ai_reject_notes_prompt"));
        if (notes === null) return;
        payload.notes = notes;
      }
      await reviewGeneratedContent(item._id, payload);
      toast.success(t(`ai_${action}_success`));
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || t("ai_review_error"));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <SectionSkeleton />;

  const pending = items.filter((i) => i.status === "pending_review");
  const others = items.filter((i) => i.status !== "pending_review");

  const renderCard = (item) => {
    const isEditing = editingId === item._id;
    const isExpanded = expandedId === item._id;
    const busy = busyId === item._id;
    return (
      <div key={item._id} className="border rounded-lg p-4 mb-3 bg-gray-50">
        {/* Action buttons — single row on top */}
        <div className="flex gap-2 flex-nowrap mb-3 overflow-x-auto">
          {item.status === "pending_review" && !isEditing && (
            <>
              <button onClick={() => startEdit(item)} className="btn btn-xs btn-outline border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white whitespace-nowrap" disabled={busy}>
                <Pencil size={14} /> {t("ai_edit")}
              </button>
              <button onClick={() => handleReview(item, "approve")} className="btn btn-xs btn-outline border-green-600 text-green-700 hover:bg-green-600 hover:text-white whitespace-nowrap" disabled={busy}>
                <Check size={14} /> {t("ai_approve_btn")}
              </button>
              <button onClick={() => handleReview(item, "reject")} className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white whitespace-nowrap" disabled={busy}>
                <X size={14} /> {t("ai_reject_btn")}
              </button>
              <button onClick={() => handleReview(item, "regenerate")} className="btn btn-xs btn-outline border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white whitespace-nowrap" disabled={busy}>
                <RefreshCcw size={14} /> {t("ai_regenerate")}
              </button>
            </>
          )}
          {item.status === "pending_review" && isEditing && (
            <>
              <button onClick={cancelEdit} className="btn btn-xs btn-outline border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white whitespace-nowrap" disabled={busy}>
                <X size={14} /> {t("ai_cancel")}
              </button>
              <button
                onClick={() => handleReview(item, "approve")}
                className="btn btn-xs btn-outline border-green-600 text-green-700 hover:bg-green-600 hover:text-white whitespace-nowrap"
                disabled={busy}
              >
                <Check size={14} /> {t("ai_save_and_publish")}
              </button>
            </>
          )}
          {(item.status === "rejected" || item.status === "regeneration_requested") && item.forumSub && (
            <button onClick={() => handleReview(item, "regenerate")} className="btn btn-xs btn-outline border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white whitespace-nowrap" disabled={busy}>
              <RefreshCcw size={14} /> {t("ai_regenerate")}
            </button>
          )}
          <button
            onClick={() => setExpandedId(isExpanded ? null : item._id)}
            className="btn btn-xs btn-outline border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white whitespace-nowrap ml-auto"
          >
            {isExpanded ? t("ai_hide") : t("ai_view")}
          </button>
        </div>

        {/* Title */}
        {isEditing ? (
          <input
            className="input input-bordered input-sm w-full font-semibold mb-2"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        ) : (
          <h4 className="font-semibold text-gray-800 text-base">{item.title}</h4>
        )}

        {/* Meta */}
        <div className="text-xs text-gray-500 mt-1 mb-2 flex flex-wrap gap-x-3">
          <span>{subTitle(item.forumSub)}</span>
          <span>{item.language?.toUpperCase()}</span>
          <span>{new Date(item.createdAt).toLocaleString()}</span>
          <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
          {item.publishedPost && <span className="text-green-600">→ published</span>}
        </div>

        {/* Body */}
        {isExpanded && (
          <div className="mt-2">
            {isEditing ? (
              <textarea
                className="textarea textarea-bordered w-full text-sm"
                rows={12}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.body}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <CollapsibleSection title={t("ai_content_title")}>
      {/* Schedule controls */}
      <div className="border rounded-lg p-4 mb-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock size={18} className="text-caribbean" />
          <h3 className="font-semibold text-caribbean">{t("ai_schedule_title")}</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-tufts">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
            />
            {t("ai_schedule_enabled")}
          </label>
          <label className="text-sm text-tufts">
            {t("ai_schedule_day")}
            <select
              className="select select-bordered select-sm ml-2"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              disabled={!scheduleEnabled}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {t(d.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-tufts">
            {t("ai_schedule_time")}
            <input
              type="time"
              className="input input-bordered input-sm ml-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!scheduleEnabled}
            />
          </label>
          <button
            onClick={saveSchedule}
            className="btn btn-xs btn-outline border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
            disabled={savingSchedule}
          >
            {savingSchedule ? t("ai_saving") : t("ai_save_schedule")}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">{t("ai_schedule_hint")}</p>
      </div>

      {/* Manual generation */}
      <div className="border rounded-lg p-4 mb-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-tufts" />
          <h3 className="font-semibold text-caribbean">{t("ai_generate_now")}</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-tufts">
            {t("ai_subforum")}
            <select
              className="select select-bordered select-sm ml-2"
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
            >
              {subs.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {subTitle(s)}
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleGenerate} className="btn btn-xs btn-outline border-green-600 text-green-700 hover:bg-green-600 hover:text-white" disabled={generating}>
            {generating ? t("ai_generating") : t("ai_generate_btn")}
          </button>
        </div>
      </div>

      {/* Drafts */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-tufts flex items-center gap-2">
          <FileText size={18} className="text-tufts" /> {t("ai_drafts_title")}
          {pending.length > 0 && (
            <span className="badge badge-warning">{pending.length}</span>
          )}
        </h3>
        <button onClick={load} className="btn btn-xs btn-outline border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white">
          <RefreshCw size={14} /> {t("ai_refresh")}
        </button>
      </div>

      {items.length === 0 && <p className="text-gray-500 text-sm">{t("ai_no_drafts")}</p>}

      {pending.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-caribbean mb-2">{t("ai_pending_review")}</h4>
          {pending.map(renderCard)}
        </>
      )}
      {others.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-caribbean mb-2 mt-4">{t("ai_history")}</h4>
          {others.map(renderCard)}
        </>
      )}
    </CollapsibleSection>
  );
}
