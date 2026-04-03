import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import { useDashboard } from "../../contexts/DashboardContext";

export default function ForumModRequestsSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { modRequests, refreshModRequests, loading: dashboardLoading } = useDashboard();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [status]);

  useEffect(() => {
    // Initial load when component mounts
    if (modRequests.length === 0) {
      loadRequests();
    }
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const filters = status ? { status } : {};
      await refreshModRequests(filters);
    } catch (err) {
      toast.error(t("failed_load_mod_requests"));
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) => {
    const base = "px-2 py-0.5 rounded text-xs font-medium";
    if (s === "approved") return `${base} bg-green-100 text-green-700`;
    if (s === "rejected") return `${base} bg-red-100 text-red-700`;
    return `${base} bg-yellow-100 text-yellow-700`;
  };

  // Use dashboard loading state for initial load, local loading for refreshes
  const isLoading = dashboardLoading || loading;
  return (
    <CollapsibleSection title={t("forum_mod_requests_title")}>
      <div className="space-y-4">
        {/* FILTER */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded w-full md:w-64"
        >
          <option value="">{t("filter_all_statuses")}</option>
          <option value="pending">{t("status_pending")}</option>
          <option value="approved">{t("status_approved")}</option>
          <option value="rejected">{t("status_rejected")}</option>
        </select>

        {/* RESULTS */}
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-caribbean animate-spin" />
            <p className="mt-3 text-caribbean font-medium animate-pulse">
              {t("loading_mod_requests")}
            </p>
          </div>
        ) : modRequests.length === 0 ? (
          <p className="text-gray-500 text-sm mt-10">
            {t("no_mod_requests")}
          </p>
        ) : (
          modRequests.map((req) => (
            <div
              key={req._id}
              className="border rounded p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() =>
                navigate(`/admin/forum/mod-requests/${req._id}`)
              }
            >
              <div className="flex justify-between items-start">
                <div className="text-sm text-tufts space-y-1">
                  <p className="font-semibold text-caribbean">
                    {req.user?.fullName}
                  </p>
                  <p className="text-xs text-gray-600">{req.user?.email}</p>

                  <p>
                    <span className="font-semibold">{t("sub_label")}</span>{" "}
                    {req.sub?.title?.en || req.sub?.title}{" "}
                    <span className="text-gray-400">(/ {req.sub?.slug})</span>
                  </p>

                  <span className={statusBadge(req.status)}>
                    {req.status === "approved" ? t("status_approved") : 
                     req.status === "rejected" ? t("status_rejected") : 
                     t("status_pending")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}
