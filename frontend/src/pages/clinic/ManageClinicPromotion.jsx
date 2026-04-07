import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { 
  Building, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Eye,
  ArrowLeft,
  Save,
  X
} from "lucide-react";
import toast from "react-hot-toast";

export default function ManageClinicPromotion() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { promotionId } = useParams();
  const navigate = useNavigate();

  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    customTitle: "",
    customDescription: "",
  });

  const promotionTiers = {
    Silver: { duration: 7, price: 50000 },
    Gold: { duration: 14, price: 100000 },
    Platinum: { duration: 30, price: 200000 },
  };

  useEffect(() => {
    fetchPromotion();
  }, [promotionId]);

  const fetchPromotion = async () => {
    try {
      const response = await API.get(`${API_URL}/promotions/clinic/${promotionId}`);
      const promoData = response.data;
      
      // Check if user owns this promotion
      if (promoData.clinic.ownerUserId !== user._id) {
        toast.error(t("not_authorized"));
        navigate("/dashboard");
        return;
      }

      setPromotion(promoData);
      setFormData({
        customTitle: promoData.customTitle || "",
        customDescription: promoData.customDescription || "",
      });
    } catch (error) {
      console.error("Failed to fetch promotion:", error);
      toast.error(t("failed_to_load_promotion"));
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      
      if (formData.customTitle) formDataToSend.append("customTitle", formData.customTitle);
      if (formData.customDescription) formDataToSend.append("customDescription", formData.customDescription);
      if (image) formDataToSend.append("clinicPromotion", image);

      await API.put(`${API_URL}/promotions/clinic/${promotionId}`, formDataToSend);
      
      toast.success(t("promotion_updated_success"));
      setEditing(false);
      setImage(null);
      setImagePreview(null);
      
      // Refetch promotion data
      await fetchPromotion();
    } catch (error) {
      console.error("Failed to update promotion:", error);
      toast.error(t("failed_to_update_promotion"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const backup = promotion;
    let deleteCancelled = false;
    setPromotion(null);

    const toastId = toast((tObj) => (
      <div className="flex items-center gap-3">
        <span>{t("promotion_deleted")}</span>
        <button
          onClick={() => {
            setPromotion(backup);
            deleteCancelled = true;
            toast.dismiss(tObj.id);
          }}
          className="text-blue-500 underline"
        >
          {t("undo")}
        </button>
      </div>
    ));

    setTimeout(async () => {
      if (deleteCancelled) return;
      
      try {
        await API.delete(`${API_URL}/promotions/clinic/${promotionId}`);
        toast.success(t("promotion_deleted_success"));
        navigate("/dashboard");
      } catch (error) {
        setPromotion(backup);
        toast.error(t("failed_to_delete_promotion"));
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

  const formatExpiryDate = (endDate) => {
    if (!endDate) return t("no_expiry_date");
    const expiryDate = new Date(endDate);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return t("expired");
    if (daysLeft === 0) return t("expires_today");
    if (daysLeft === 1) return t("expires_tomorrow");
    
    return t("expires_in_days", { days: daysLeft });
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 text-center">
        <div className="animate-spin w-8 h-8 border-b-2 border-caribbean mx-auto"></div>
        <p className="mt-4">{t("loading")}</p>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="pt-24 pb-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t("promotion_not_found")}</h2>
        <Link to="/dashboard" className="btn bg-caribbean text-white">
          {t("back_to_dashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 text-tufts px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-caribbean">
              {t("manage_clinic_promotion")}
            </h1>
            <p className="text-gray-600">
              {promotion.clinic.name}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="btn p-1 bg-tufts text-white"
              >
                <Edit className="w-4 h-4" />
                {t("edit")}
              </button>
              <button
                onClick={handleDelete}
                className="btn p-1 bg-red-500 text-white"
              >
                <Trash2 className="w-4 h-4" />
                {t("delete")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn p-1 bg-caribbean text-white"
              >
                <Save className="w-4 h-4" />
                {saving ? t("saving") : t("save")}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setImage(null);
                  setImagePreview(null);
                  // Reset form data
                  setFormData({
                    customTitle: promotion.customTitle || "",
                    customDescription: promotion.customDescription || "",
                  });
                }}
                className="btn p-1 btn-ghost"
              >
                <X className="w-4 h-4" />
                {t("cancel")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("promotion_details")}</h2>
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(promotion.status)}`}>
            {t(promotion.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("promotion_tier")}
            </label>
            <p className="text-lg font-semibold text-caribbean">
              {promotion.title}
            </p>
            <p className="text-sm text-gray-600">
              {promotionTiers[promotion.title]?.price.toLocaleString()} TZS
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("duration")}
            </label>
            <p className="text-lg font-semibold">
              {promotion.duration} {t("days")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("expiry_date")}
            </label>
            <p className="text-lg font-semibold">
              {formatExpiryDate(promotion.endAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t("edit_promotion")}</h2>

          <div className="space-y-4">
            {/* Custom Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("custom_title")} ({t("optional")})
              </label>
              <input
                type="text"
                name="customTitle"
                value={formData.customTitle}
                onChange={handleChange}
                placeholder={t("custom_promotion_title_placeholder")}
                className="input input-bordered w-full"
              />
            </div>

            {/* Custom Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("custom_description")} ({t("optional")})
              </label>
              <textarea
                name="customDescription"
                rows="4"
                value={formData.customDescription}
                onChange={handleChange}
                placeholder={t("custom_promotion_description_placeholder")}
                className="textarea textarea-bordered w-full"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("promotion_image")} ({t("optional")})
              </label>

              <div className="mt-2">
                <img
                  src={
                    imagePreview || 
                    promotion.imageUrl || 
                    "https://via.placeholder.com/400x200?text=Clinic+Promotion"
                  }
                  alt="Promotion preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="file-input file-input-bordered w-full mt-3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Current Promotion Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{t("current_promotion")}</h2>

        <div className="space-y-4">
          {/* Display Image */}
          {(promotion.imageUrl || promotion.customTitle || promotion.customDescription) && (
            <div className="border rounded-lg p-4">
              {promotion.imageUrl && (
                <img
                  src={promotion.imageUrl}
                  alt="Promotion"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              {promotion.customTitle && (
                <h3 className="text-xl font-semibold mb-2">
                  {promotion.customTitle}
                </h3>
              )}

              {promotion.customDescription && (
                <p className="text-gray-600">
                  {promotion.customDescription}
                </p>
              )}

              {!promotion.customTitle && !promotion.customDescription && !promotion.imageUrl && (
                <p className="text-gray-500 italic">
                  {t("no_custom_content")}
                </p>
              )}
            </div>
          )}

          {/* Clinic Info */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            <span>{promotion.clinic.name}</span>
            <span>•</span>
            <span>{promotion.clinic.address}</span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{t("created")}: {new Date(promotion.createdAt).toLocaleDateString()}</span>
            </div>
            {promotion.endAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{t("expires")}: {new Date(promotion.endAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
