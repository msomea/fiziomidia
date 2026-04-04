import { useEffect, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";

export default function ClinicPromotionSection() {
  const { t } = useTranslation();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");       // search clinic name or address
  const [status, setStatus] = useState("");       // sort/filter by status

  useEffect(() => {
    loadClinicPromotions();
  }, [search, status]);

  const loadClinicPromotions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const res = await API.get(`${API_URL}/admin/clinic-promotions?${params}`);
      setPromotions(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error(t("failed_load_clinic_promotions"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CollapsibleSection title={t("clinic_promotions_section_title")}>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder={t("search_clinic_placeholder")}
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

      {/* CLINIC PROMOTIONS LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean"></div>
          <span className="ml-2 text-gray-500">Loading clinic promotions...</span>
        </div>
      ) : promotions.length === 0 ? (
        <p className="text-gray-500 text-sm mt-4">{t("no_clinic_promotions_found")}</p>
      ) : (
        promotions.map((promo) => (
          <div key={promo._id} className="mt-2 p-2 bg-gray-100 rounded text-tufts">
            <Link to={`/admin/clinic-promotions/${promo._id}`}>
              <h3 className="font-bold textarea-s text-caribbean">
                {t("clinic_promotion_number", { id: promo._id })}
              </h3>
            </Link>
            <div className="text-sm">
              <p><b>{t("clinic_label")}:</b> {promo.clinic?.name}</p>
              <p><b>{t("address_label")}:</b> {promo.clinic?.address}</p>
              <p><b>{t("owner_label")}:</b> {promo.clinic?.ownerUserId?.fullName || promo.clinic?.ownerName}</p>
              <p><b>{t("status_label")}:</b> {promo.status || t("unknown")}</p>
              <p><b>{t("tier_label")}:</b> {promo.title}</p>
              <p><b>{t("due_date_label")}:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
              {promo.customTitle && (
                <p><b>{t("custom_title_label")}:</b> {promo.customTitle}</p>
              )}
            </div>
          </div>
        ))
      )}

      <p className="text-xs text-gray-400 mt-2">{t("clinic_promotions_list_note")}</p>
    </CollapsibleSection>
  );
}
