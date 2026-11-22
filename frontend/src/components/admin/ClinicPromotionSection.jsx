import { useEffect, useState, useMemo } from "react";
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

export default function ClinicPromotionSection() {
  const { t } = useTranslation();
  const { clinicPromotions, loading: dashboardLoading } = useDashboard();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");       // search clinic name or address
  const [status, setStatus] = useState("");       // sort/filter by status

  const loadClinicPromotions = async () => {
    try {
      setLoading(true);
      const result = await performUnifiedSearch({
        types: ['clinic-promotions'],
        search,
        filters: { status },
        limit: 20
      });
      setPromotions(result.clinicPromotions || []);
    } catch (error) {
      console.error('Failed to load clinic promotions via unified search:', error);
      toast.error(t("failed_load_clinic_promotions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load promotions when filters change (also runs on mount)
    loadClinicPromotions();
  }, [search, status]);

  // Stats derived from the full clinic promotions dataset in context
  const stats = useMemo(() => {
    const source = Array.isArray(clinicPromotions) ? clinicPromotions : [];
    return {
      total: source.length,
      pending: source.filter((p) => p.status === "pending").length,
      active: source.filter((p) => p.status === "active").length,
      expired: source.filter((p) => p.status === "expired").length,
      suspended: source.filter((p) => p.status === "suspended").length,
    };
  }, [clinicPromotions]);

  const isLoading = dashboardLoading || loading;
  const displayPromotions = promotions;

  return (
    <CollapsibleSection title={t("clinic_promotions_section_title")}>
      <div className="flex justify-end mb-3">
        <button onClick={loadClinicPromotions} className="btn btn-xs btn-ghost text-caribbean">
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
          placeholder={t("search_clinic_placeholder")}
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

      {/* CLINIC PROMOTIONS LIST */}
      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : displayPromotions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t("no_clinic_promotions_found")}</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {displayPromotions.map((promo) => (
            <div key={promo._id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/admin/clinic-promotions/${promo._id}`}>
                    <h3 className="font-bold text-caribbean">
                      {t("clinic_promotion_number", { id: promo._id })}
                    </h3>
                  </Link>
                  <div className="text-sm mt-1 text-tufts">
                    <p><b>{t("clinic_label")}:</b> {promo.clinic?.name}</p>
                    <p><b>{t("address_label")}:</b> {promo.clinic?.address}</p>
                    <p><b>{t("owner_label")}:</b> {promo.clinic?.ownerUserId?.fullName}</p>
                    <p><b>{t("tier_label")}:</b> {promo.title}</p>
                    <p><b>{t("due_date_label")}:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
                    {promo.customTitle && (
                      <p><b>{t("custom_title_label")}:</b> {promo.customTitle}</p>
                    )}
                  </div>
                </div>
                <ResourceStatusBadge status={promo.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">{t("clinic_promotions_list_note")}</p>
    </CollapsibleSection>
  );
}
