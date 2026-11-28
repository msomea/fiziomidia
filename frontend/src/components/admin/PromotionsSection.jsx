import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import ResourceStatusBadge from "../education/ResourceStatusBadge";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Link } from "react-router";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../contexts/DashboardContext";
import { performUnifiedSearch } from "../../api/admin";

export default function PromotionsSection() {
  const { t } = useTranslation();
  const { promotions, loading: dashboardLoading } = useDashboard();

  // Filters
  const [search, setSearch] = useState("");       // search PT name or email
  const [status, setStatus] = useState("");       // sort/filter by status
  const [loading, setLoading] = useState(false);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const isFirstRender = useRef(true);
  const hasLoadedRef = useRef(false);

  // Seed local list from dashboard context until this section fetches its own data
  useEffect(() => {
    if (!hasLoadedRef.current && Array.isArray(promotions) && promotions.length > 0) {
      setFilteredPromotions(promotions);
    }
  }, [promotions]);

  const loadPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await performUnifiedSearch({
        types: ['promotions'],
        search,
        filters: { status },
        limit: 20
      });
      hasLoadedRef.current = true;
      setFilteredPromotions(result.promotions || []);
    } catch (error) {
      console.error('Failed to load promotions via unified search:', error);
      toast.error(t("failed_load_promotions"));
    } finally {
      setLoading(false);
    }
  }, [search, status, t]);

  useEffect(() => {
    // Load promotions when filters change — skipped on mount (context provides initial data)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadPromotions();
  }, [loadPromotions]);

  // Stats derived from the full promotions dataset in context
  const stats = useMemo(() => {
    const source = Array.isArray(promotions) ? promotions : [];
    return {
      total: source.length,
      pending: source.filter((p) => p.status === "pending").length,
      active: source.filter((p) => p.status === "active").length,
      expired: source.filter((p) => p.status === "expired").length,
      suspended: source.filter((p) => p.status === "suspended").length,
    };
  }, [promotions]);

  const isLoading = dashboardLoading || loading;
  const displayPromotions = filteredPromotions;

  return (
    <CollapsibleSection title={t("promotions_section_title")}>
      <div className="flex justify-end mb-3">
        <button onClick={loadPromotions} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
          {[
            ["stat_total", stats.total],
            ["status_pending", stats.pending],
            ["status_active", stats.active],
            ["status_expired", stats.expired],
            ["status_suspended", stats.suspended],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          placeholder={t("search_pt_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered input-xs"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select select-bordered select-xs"
        >
          <option value="">{t("all_status")}</option>
          <option value="pending">{t("status_pending")}</option>
          <option value="active">{t("status_active")}</option>
          <option value="expired">{t("status_expired")}</option>
          <option value="suspended">{t("status_suspended")}</option>
        </select>
      </div>

      {/* PROMOTIONS LIST */}
      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : displayPromotions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t("no_promotions_found")}</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {displayPromotions.map((promo) => (
            <div key={promo._id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/admin/promotions/${promo._id}`}>
                    <h3 className="font-bold text-caribbean">
                      {t("promotion_number", { id: promo._id })}
                    </h3>
                  </Link>
                  <div className="text-sm mt-1 text-tufts">
                    <p><b>{t("pt_label")}:</b> {promo.pt?.fullName}</p>
                    <p><b>{t("email_label")}:</b> {promo.pt?.email}</p>
                    <p><b>{t("due_date_label")}:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
                  </div>
                </div>
                <ResourceStatusBadge status={promo.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">{t("promotions_list_note")}</p>
    </CollapsibleSection>
  );
}
