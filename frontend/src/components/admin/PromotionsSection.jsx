import { useEffect, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../contexts/DashboardContext";
import { performUnifiedSearch } from "../../api/admin";
 
export default function PromotionsSection() {
  const { t } = useTranslation();
  const { promotions, refreshPromotions, loading: dashboardLoading } = useDashboard();

  // Filters
  const [search, setSearch] = useState("");       // search PT name or email
  const [status, setStatus] = useState("");       // sort/filter by status
  const [loading, setLoading] = useState(false);
  const [filteredPromotions, setFilteredPromotions] = useState([]);

  useEffect(() => {
    // Load promotions when filters change
    loadPromotions();
  }, [search, status]);

  // Initial load if promotions is empty
  useEffect(() => {
    if (!promotions || promotions.length === 0) {
      loadPromotions();
    }
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const result = await performUnifiedSearch({
        types: ['promotions'],
        search,
        filters: { status },
        limit: 20
      });
      console.log('Promotions loaded via unified search:', result);
      setFilteredPromotions(result.promotions || []);
    } catch (error) {
      console.error('Failed to load promotions via unified search:', error);
      toast.error(t("failed_load_promotions"));
    } finally {
      setLoading(false);
    }
  };

  // Use dashboard loading state for initial load, local loading for refreshes
  const isLoading = dashboardLoading || loading;

  return (
    <CollapsibleSection title={t("promotions_section_title")}>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder={t("search_pt_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
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
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean"></div>
          <span className="ml-2 text-gray-500">Loading promotions...</span>
        </div>
      ) : promotions.length === 0 ? (
        <p className="text-gray-500 text-sm mt-4">{t("no_promotions_found")}</p>
      ) : (
        promotions.map((promo) => (
          <div key={promo._id} className="mt-2 p-2 bg-gray-100 rounded text-tufts">
            <Link to={`/admin/promotions/${promo._id}`}>
              <h3 className="font-bold textarea-s text-caribbean">
                {t("promotion_number", { id: promo._id })}
              </h3>
            </Link>
            <div className="text-sm">
              <p><b>{t("pt_label")}:</b> {promo.pt?.fullName}</p>
              <p><b>{t("email_label")}:</b> {promo.pt?.email}</p>
              <p><b>{t("status_label")}:</b> {promo.status || t("unknown")}</p>
              <p><b>{t("due_date_label")}:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
            </div>
          </div>
        ))
      )}

      <p className="text-xs text-gray-400 mt-2">{t("promotions_list_note")}</p>
    </CollapsibleSection>
  );
}
