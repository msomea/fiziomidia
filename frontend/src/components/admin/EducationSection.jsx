import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  adminFetchEducationStats,
  adminFetchResources,
  adminReviewResource,
  adminFetchReports,
  adminUpdateReport,
  adminFetchRequests,
  adminUpdateRequest,
  adminFetchDownloadUrl,
} from "../../api/education";
import ResourceStatusBadge from "../education/ResourceStatusBadge";
import ResourceSkeleton from "../education/ResourceSkeleton";
import { REPORT_REASONS } from "../../constants/education";
import CollapsibleSection from "./CollapsibleSection";
import { CheckCircle, XCircle, PauseCircle, PlayCircle, Trash2, RefreshCw, Eye } from "lucide-react";

const TABS = ["resources", "reports", "requests"];

export default function EducationSection() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("resources");
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [busy, setBusy] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await adminFetchEducationStats();
      setStats(res.data.stats);
    } catch {
      // stats are non-critical
    }
  }, []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "resources") {
        const res = await adminFetchResources({ status: statusFilter || undefined, limit: 50 });
        setResources(res.data.resources || []);
      } else if (tab === "reports") {
        const res = await adminFetchReports({ limit: 50 });
        setReports(res.data.reports || []);
      } else {
        const res = await adminFetchRequests({ limit: 50 });
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_admin_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadTab(); }, [loadTab]);

  const review = async (id, action, reason, holdToggle) => {
    setBusy(id);
    try {
      const payload = {};
      if (action) payload.action = action;
      if (reason) payload.reason = reason;
      if (holdToggle !== undefined) payload.downloadHold = holdToggle;
      await adminReviewResource(id, payload);
      toast.success(t("edu_admin_action_done"));
      loadTab();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_admin_action_failed"));
    } finally {
      setBusy(null);
    }
  };

  const updateReport = async (id, payload) => {
    setBusy(id);
    try {
      await adminUpdateReport(id, payload);
      toast.success(t("edu_admin_action_done"));
      loadTab();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_admin_action_failed"));
    } finally {
      setBusy(null);
    }
  };

  const preview = async (id) => {
    setBusy(id);
    try {
      const res = await adminFetchDownloadUrl(id);
      window.open(res.data.downloadUrl, "_blank");
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_download_failed"));
    } finally {
      setBusy(null);
    }
  };

  const updateRequest = async (id, payload) => {
    setBusy(id);
    try {
      await adminUpdateRequest(id, payload);
      toast.success(t("edu_admin_action_done"));
      loadTab();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_admin_action_failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <CollapsibleSection title={t("edu_admin_title")}>
      <div className="flex justify-end mb-3">
        <button onClick={() => { loadStats(); loadTab(); }} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {[
            ["edu_admin_pending", stats.pendingUploads],
            ["edu_admin_approved", stats.approvedResources],
            ["edu_admin_suspended", stats.suspendedResources],
            ["edu_admin_reports", stats.openReports],
            ["edu_admin_requests", stats.openRequests],
            ["edu_admin_downloads", stats.totalDownloads],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`btn btn-xs ${tab === tb ? "bg-caribbean text-white border-none" : "bg-tufts text-white border-none hover:bg-caribbean"}`}
          >
            {t(`edu_admin_tab_${tb}`)}
          </button>
        ))}
        {tab === "resources" && (
          <select
            className="select select-bordered select-xs ml-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t("edu_admin_all_status")}</option>
            {["pending", "approved", "rejected", "suspended", "removed"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <ResourceSkeleton count={3} />
      ) : tab === "resources" ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {resources.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t("edu_admin_empty")}</p>}
          {resources.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400">
                    {r.category} · {r.fileType?.toUpperCase()} · {r.uploadedBy?.fullName || "?"} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  {r.licenseType && <p className="text-xs text-gray-400">{t(`edu_license_${r.licenseType}`)}</p>}
                  {r.rejectionReason && <p className="text-xs text-red-500">{r.rejectionReason}</p>}
                </div>
                <ResourceStatusBadge status={r.status} />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {r.status !== "removed" && (
                  <button
                    disabled={busy === r._id}
                    onClick={() => preview(r._id)}
                    className="btn btn-xs btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
                  >
                    <Eye className="w-3 h-3" /> {t("edu_admin_preview")}
                  </button>
                )}
                {r.status === "pending" && (
                  <>
                    <button disabled={busy === r._id} onClick={() => review(r._id, "approved")} className="btn btn-xs btn-outline border-green-600 text-green-700 hover:bg-green-600 hover:text-white"><CheckCircle className="w-3 h-3" /> {t("edu_admin_approve")}</button>
                    <button disabled={busy === r._id} onClick={() => { const reason = window.prompt(t("edu_admin_reject_reason_prompt")); if (reason !== null) review(r._id, "rejected", reason); }} className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white"><XCircle className="w-3 h-3" /> {t("edu_admin_reject")}</button>
                  </>
                )}
                {r.status === "approved" && (
                  <>
                    <button disabled={busy === r._id} onClick={() => review(r._id, "suspended")} className="btn btn-xs btn-outline border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"><PauseCircle className="w-3 h-3" /> {t("edu_admin_suspend")}</button>
                    <button disabled={busy === r._id} onClick={() => review(r._id, "removed")} className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white"><Trash2 className="w-3 h-3" /> {t("edu_admin_remove")}</button>
                  </>
                )}
                {r.status === "suspended" && (
                  <>
                    <button disabled={busy === r._id} onClick={() => review(r._id, "approved")} className="btn btn-xs btn-outline border-green-600 text-green-700 hover:bg-green-600 hover:text-white"><PlayCircle className="w-3 h-3" /> {t("edu_admin_restore")}</button>
                    <button disabled={busy === r._id} onClick={() => review(r._id, "removed")} className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white"><Trash2 className="w-3 h-3" /> {t("edu_admin_remove")}</button>
                  </>
                )}
                {r.status !== "removed" && (
                  <button
                    disabled={busy === r._id}
                    onClick={() => review(r._id, undefined, undefined, !r.downloadHold)}
                    className={`btn btn-xs border ${r.downloadHold ? "border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white" : "border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white"}`}
                  >
                    {r.downloadHold ? t("edu_admin_release_hold") : t("edu_admin_hold")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : tab === "reports" ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {reports.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t("edu_admin_empty")}</p>}
          {reports.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-800">{r.resource?.title || "?"}</p>
                  <p className="text-xs text-gray-400">
                    {t(REPORT_REASONS.find((x) => x.value === r.reason)?.labelKey || "edu_report_reason_other")} · {r.complainantName} · {r.contactEmail}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.explanation}</p>
                </div>
                <ResourceStatusBadge status={r.status} />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {r.status === "pending" && (
                  <button disabled={busy === r._id} onClick={() => updateReport(r._id, { status: "under_review" })} className="btn btn-xs btn-outline border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white">{t("edu_admin_under_review")}</button>
                )}
                {r.status !== "resolved" && r.status !== "rejected" && (
                  <>
                    <button disabled={busy === r._id} onClick={() => updateReport(r._id, { status: "resolved", actionTaken: "no_action" })} className="btn btn-xs btn-outline border-green-600 text-green-700 hover:bg-green-600 hover:text-white">{t("edu_admin_resolve")}</button>
                    <button disabled={busy === r._id} onClick={() => updateReport(r._id, { status: "rejected" })} className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white">{t("edu_admin_reject_report")}</button>
                    {r.resource && r.resource.status !== "removed" && (
                      <button disabled={busy === r._id} onClick={() => review(r.resource._id, "removed")} className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white"><Trash2 className="w-3 h-3" /> {t("edu_admin_remove_resource")}</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {requests.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t("edu_admin_empty")}</p>}
          {requests.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.category} · {r.requestedBy?.fullName || "?"}</p>
                </div>
                <ResourceStatusBadge status={r.status} />
              </div>
              {r.status === "open" && (
                <div className="flex gap-1 mt-2">
                  <button disabled={busy === r._id} onClick={() => updateRequest(r._id, { status: "closed" })} className="btn btn-xs btn-outline border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white">{t("edu_admin_close_request")}</button>
                  <button disabled={busy === r._id} onClick={() => updateRequest(r._id, { status: "rejected" })} className="btn btn-xs btn-outline border-red-600 text-red-600 hover:bg-red-600 hover:text-white">{t("edu_admin_reject")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}
