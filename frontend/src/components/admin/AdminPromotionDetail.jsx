import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getPromotionById, updatePromotion as updatePromotionApi, deletePromotion } from "../../api/admin";
import { X, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next'
import toast from "react-hot-toast";

export default function AdminPromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation()

  useEffect(() => {
    loadPromotion();
  }, []);

  const loadPromotion = async () => {
    try {
      setLoading(true);
      const data = await getPromotionById(id);
      setPromo(data.promotion);
      setStatus(data.promotion.status);

      // Convert to yyyy-mm-dd for HTML date input
      setEndAt(dayjs(data.promotion.endAt).format("YYYY-MM-DD"));
    } catch (err) {
      toast.error(t('failed_load_promotion'));
    } finally {
      setLoading(false);
    }
  };

  const updatePromotion = async () => {
    try {
      setSaving(true);
      await updatePromotionApi(id, {
        status,
        endAt,
      });

      toast.success(t('promotion_updated'));
      loadPromotion();
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
          <span>{t('promotion_deleted')}</span>
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
          await deletePromotion(id);
          toast.success(t('promotion_permanently_deleted'));
          navigate("/dashboard/admin"); // redirect after deletion
        } catch (err) {
          console.error(err);
          setPromo(backupPromo);
          toast.error(t('failed_delete_promotion'));
        }
    }, 5000);
  };


  if (loading || !promo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">{t('loading_promotion')}</p>
      </div>
    );
  }

  // Determine image: use promotion image if uploaded, otherwise PT profile image
  const promoImage = promo.imageUrl || promo.pt.profileImageUrl;

  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-caribbean">{t('manage_promotion')}</h3>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-800" />
        </button>
      </div>

      {/* IMAGE */}
      <div className="mb-4">
        <img
          src={promoImage}
          alt="Promotion"
          className="w-full h-64 object-cover rounded-lg border"
        />
      </div>

      <div className="space-y-4 text-sm text-tufts">
        {/* PT INFO */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-1 text-caribbean">{t('pt_information')}</h3>
          <p><b>Name:</b> {promo.pt?.fullName}</p>
          <p><b>Email:</b> {promo.pt?.email}</p>
        </div>

        {/* PROMOTION INFO */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-1 text-caribbean">{t('promotion_details')}</h3>
          <p><b>{t('title_label')}</b> {promo.title}</p>
          <p><b>{t('description_label')}</b> {promo.description}</p>
          <p><b>{t('status_label')}</b> {promo.status}</p>
          <p><b>{t('start_label')}</b> {dayjs(promo.startAt).format("ddd, DD/MM/YYYY")}</p>
          <p><b>{t('end_label')}</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
          <p><b>{t('created_label')}</b> {dayjs(promo.createdAt).format("ddd, DD/MM/YYYY")}</p>
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
          {t('delete_promotion')}
        </button>
      </div>
    </div>
  );
}
