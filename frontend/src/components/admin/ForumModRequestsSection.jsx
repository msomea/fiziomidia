import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import ResourceStatusBadge from "../education/ResourceStatusBadge";
import { useDashboard } from "../../contexts/DashboardContext";

export default function ForumModRequestsSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { modRequests, refreshModRequests, loading: dashboardLoading } = useDashboard();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const filters = status ? { status } : {};
      await refreshModRequests(filters);
    } catch {
      toast.error(t("failed_load_mod_requests"));
    } finally {
      setLoading(false);
    }
  }, [status, refreshModRequests, t]);

  useEffect(() => {
    // Load requests when the status filter changes (also runs on mount)
    loadRequests();
  }, [loadRequests]);

  // Stats derived from moderator requests in context
  const stats = useMemo(() => {
    const source = Array.isArray(modRequests) ? modRequests : [];
    return {
      total: source.length,
      pending: source.filter((r) => r.status === "pending").length,
      approved: source.filter((r) => r.status === "approved").length,
      rejected: source.filter((r) => r.status === "rejected").length,
    };
  }, [modRequests]);

  const isLoading = dashboardLoading || loading;
  return (
    <CollapsibleSection title={t("forum_mod_requests_title")}>
      <div className="flex justify-end mb-3">
        <button onClick={loadRequests} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            ["stat_total", stats.total],
            ["status_pending", stats.pending],
            ["status_approved", stats.approved],
            ["status_rejected", stats.rejected],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* FILTER */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="select select-bordered select-xs mb-4"
      >
        <option value="">{t("filter_all_statuses")}</option>
        <option value="pending">{t("status_pending")}</option>
        <option value="approved">{t("status_approved")}</option>
        <option value="rejected">{t("status_rejected")}</option>
      </select>

      {/* RESULTS */}
      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : !Array.isArray(modRequests) || modRequests.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          {t("no_mod_requests")}
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {modRequests.map((req) => (
            <div
              key={req._id}
              className="border border-gray-200 rounded-xl p-3 cursor-pointer hover:bg-gray-50"
              onClick={() =>
                navigate(`/admin/forum/mod-requests/${req._id}`)
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm text-tufts space-y-1">
                  <p className="font-semibold text-caribbean">
                    {req.user?.fullName}
                  </p>
                  <p className="text-xs text-gray-600">{req.user?.email}</p>

                  <p>
                    <span className="font-semibold">{t("sub_label")}</span>{" "}
                    {req.sub?.title?.en || req.sub?.title}{" "}
                    <span className="text-gray-400">(/ {req.sub?.slug})</span>
                  </p>
                </div>
                <ResourceStatusBadge status={req.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}
