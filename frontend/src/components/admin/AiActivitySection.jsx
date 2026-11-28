import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { RefreshCw, ClipboardCheck, AlertTriangle } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import { listAIActivity, reviewAIActivity } from "../../api/ai";

const AGENT_LABELS = {
  physiotherapy: "Fizio AI",
  forumContent: "Forum Content",
  virtualAdmin: "Virtual Admin",
  system: "System",
};

const actionBadge = (action) => {
  if (action?.includes("ESCALATION") || action?.includes("ANOMALY"))
    return "badge-error";
  if (action?.includes("QUOTA")) return "badge-warning";
  return "badge-ghost";
};

export default function AiActivitySection() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewOnly, setReviewOnly] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAIActivity({
        requiresHumanReview: reviewOnly ? "true" : undefined,
        unreviewed: reviewOnly ? "true" : undefined,
        page,
        limit: 25,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      console.error("AI activity load failed:", err);
      toast.error(err?.response?.data?.error || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [page, reviewOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const markReviewed = async (id) => {
    setReviewing(id);
    try {
      await reviewAIActivity(id);
      toast.success(t("ai_activity_reviewed"));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Review failed");
    } finally {
      setReviewing(null);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleString() : "—";

  const detailsPreview = (d) => {
    if (!d) return "—";
    const s = typeof d === "string" ? d : JSON.stringify(d);
    return s.length > 120 ? s.slice(0, 120) + "…" : s;
  };

  return (
    <CollapsibleSection title={t("ai_activity_title")}>
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center gap-2 text-tufts text-sm cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-xs"
            checked={reviewOnly}
            onChange={(e) => {
              setReviewOnly(e.target.checked);
              setPage(1);
            }}
          />
          {t("ai_activity_review_only")}
        </label>
        <button onClick={load} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && items.length === 0 ? (
        <SectionSkeleton count={1} />
      ) : items.length === 0 ? (
        <p className="text-sm text-tufts flex items-center gap-1">
          <ClipboardCheck size={14} /> {t("ai_activity_empty")}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table text-tufts table-xs w-full">
              <thead className="text-caribbean">
                <tr>
                  <th>{t("ai_activity_date")}</th>
                  <th>{t("ai_usage_agent")}</th>
                  <th>{t("ai_activity_action")}</th>
                  <th>{t("ai_activity_actor")}</th>
                  <th>{t("ai_activity_details")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log._id}>
                    <td className="whitespace-nowrap">{fmtDate(log.createdAt)}</td>
                    <td>{AGENT_LABELS[log.agent] || log.agent}</td>
                    <td>
                      <span className={`badge badge-xs ${actionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-xs">
                      {log.actor?.name || log.actor?.email || "—"}
                    </td>
                    <td className="text-xs max-w-xs truncate" title={detailsPreview(log.details)}>
                      {detailsPreview(log.details)}
                    </td>
                    <td>
                      {!log.reviewedAt && log.requiresHumanReview && (
                        <button
                          className="btn btn-xs btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
                          disabled={reviewing === log._id}
                          onClick={() => markReviewed(log._id)}
                        >
                          <AlertTriangle size={12} className="mr-1" />
                          {t("ai_activity_mark_reviewed")}
                        </button>
                      )}
                      {log.reviewedAt && (
                        <span className="badge badge-xs badge-success">
                          {t("ai_activity_reviewed_badge")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              <button
                className="btn btn-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("ai_activity_prev")}
              </button>
              <span className="text-xs self-center">
                {page}/{pages} ({total})
              </span>
              <button
                className="btn btn-xs"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("ai_activity_next")}
              </button>
            </div>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
