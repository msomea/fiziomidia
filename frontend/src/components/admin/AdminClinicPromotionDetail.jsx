import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getClinicPromotionById, updateClinicPromotion, updateClinicPromotionWithCacheInvalidation, deleteClinicPromotion } from "../../api/admin";
import { X, Loader2, Building, MapPin, Calendar, User } from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next'
import toast from "react-hot-toast";
import { useHomePage } from "../../contexts/HomePageContext";

export default function AdminClinicPromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation()
  const { forceRefreshHomePage } = useHomePage();

  useEffect(() => {
    loadClinicPromotion();
  }, []);

  const loadClinicPromotion = async () => {
    try {
      setLoading(true);
      const data = await getClinicPromotionById(id);
      setPromo(data.promotion);
      setStatus(data.promotion.status);

      // Convert to yyyy-mm-dd for HTML date input
      setEndAt(dayjs(data.promotion.endAt).format("YYYY-MM-DD"));
    } catch (err) {
      toast.error(t('failed_load_clinic_promotion'));
    } finally {
      setLoading(false);
    }
  };

  const updatePromotion = async () => {
    try {
      setSaving(true);
      await updateClinicPromotionWithCacheInvalidation(id, {
        status,
        endAt,
      }, forceRefreshHomePage);

      toast.success(t('clinic_promotion_updated'));
      loadClinicPromotion();
    } catch (err) {
      toast.error(t('update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const deletePromotion = async () => {
    // Backup current promo
    const backupPromo = { ...promo };

    // Remove from UI immediately
    setPromo(null);

    let undoClicked = false;

    // Show toast with Undo button
    toast(
      (tToast) => (
        <div className="flex items-center gap-3">
          <span>{t('clinic_promotion_deleted')}</span>
          <button
            onClick={() => {
              undoClicked = true;
              setPromo(backupPromo);
              toast.dismiss(tToast.id);
            }}
            className="text-blue-500 underline"
          >
            {t('undo')}
          </button>
        </div>
      ),
      { duration: 5000 } // 5 seconds to undo
    );

    // Wait 5 seconds, then call backend if not undone
    setTimeout(async () => {
      if (undoClicked) return;
        try {
          await deleteClinicPromotion(id);
          toast.success(t('clinic_promotion_permanently_deleted'));
          navigate("/dashboard/admin"); // redirect after deletion
        } catch (err) {
          console.error(err);
          setPromo(backupPromo);
          toast.error(t('failed_delete_clinic_promotion'));
        }
    }, 5000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "expired":
      case "suspended":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading || !promo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">{t('loading_clinic_promotion')}</p>
      </div>
    );
  }

  // Determine image: use promotion image if uploaded, otherwise clinic image
  const promoImage = promo.imageUrl || promo.clinic?.imageUrl;

  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-caribbean">{t('manage_clinic_promotion')}</h3>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-800" />
        </button>
      </div>

      {/* IMAGE */}
      <div className="mb-4">
        <img
          src={promoImage}
          alt="Clinic Promotion"
          className="w-full h-64 object-cover rounded-lg border"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x300?text=Clinic+Promotion";
          }}
        />
      </div>

      <div className="space-y-4 text-sm text-tufts">
        {/* CLINIC INFO */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-2 text-caribbean flex items-center gap-2">
            <Building className="w-4 h-4" />
            {t('clinic_information')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p><b>{t('name_label')}:</b> {promo.clinic?.name}</p>
              <p><b>{t('address_label')}:</b> {promo.clinic?.address}</p>
              <p><b>{t('contact_label')}:</b> {promo.clinic?.contactPhone}</p>
            </div>
            <div>
              <p><b>{t('owner_label')}:</b> {promo.clinic?.ownerUserId?.fullName}</p>
              <p><b>{t('owner_email')}:</b> {promo.clinic?.ownerUserId?.email}</p>
              <p><b>{t('services_label')}:</b> {promo.clinic?.services?.join(", ") || t("no_services")}</p>
            </div>
          </div>
        </div>

        {/* PROMOTION INFO */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-2 text-caribbean flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('promotion_details')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p><b>{t('tier_label')}:</b> {promo.title}</p>
              <p><b>{t('status_label')}:</b> 
                <span className={`ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promo.status)}`}>
                  {promo.status}
                </span>
              </p>
              <p><b>{t('duration_label')}:</b> {promo.duration} {t('days')}</p>
            </div>
            <div>
              <p><b>{t('start_label')}:</b> {dayjs(promo.startAt).format("ddd, DD/MM/YYYY")}</p>
              <p><b>{t('end_label')}:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
              <p><b>{t('created_label')}:</b> {dayjs(promo.createdAt).format("ddd, DD/MM/YYYY")}</p>
            </div>
          </div>
          
          {promo.customTitle && (
            <p className="mt-2"><b>{t('custom_title_label')}:</b> {promo.customTitle}</p>
          )}
          
          {promo.customDescription && (
            <p className="mt-2"><b>{t('custom_description_label')}:</b> {promo.customDescription}</p>
          )}
        </div>

        {/* EDIT PROMOTION */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-2 text-caribbean">{t('edit_promotion')}</h3>

          {/* STATUS SELECT */}
          <label className="font-medium">{t('status_label')}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          >
            <option value="">{t('select_status')}</option>
            <option value="pending">{t('status_pending')}</option>
            <option value="active">{t('status_active')}</option>
            <option value="expired">{t('status_expired')}</option>
            <option value="suspended">{t('status_suspended')}</option>
          </select>

          {/* EDIT END DATE */}
          <label className="font-medium">{t('end_label')}</label>
          <input
            type="date"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <button
            disabled={saving}
            onClick={updatePromotion}
            className="mt-4 px-4 py-2 bg-caribbean text-white rounded hover:bg-caribbean-dark w-full"
          >
            {saving ? t('saving') : t('save_changes')}
          </button>
        </div>

        {/* DELETE */}
        <button
          onClick={deletePromotion}
          className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {t('delete_clinic_promotion')}
        </button>
      </div>
    </div>
  );
}
