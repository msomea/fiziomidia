import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";

export default function CreateClinicPromotion() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingClinics, setFetchingClinics] = useState(true);

  const promotionTiers = {
    Silver: { duration: 7, price: 50000 },
    Gold: { duration: 14, price: 100000 },
    Platinum: { duration: 30, price: 200000 },
  };

  const [form, setForm] = useState({
    clinicId: "",
    title: "",
    price: "",
    duration: "",
    customTitle: "",
    customDescription: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch user's clinics
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await API.get(`${API_URL}/clinics/my-clinics`);
        setClinics(response.data || []);
      } catch (error) {
        console.error("Failed to fetch clinics:", error);
        toast.error(t("failed_load_clinics"));
      } finally {
        setFetchingClinics(false);
      }
    };
    fetchClinics();
  }, [t]);

  // Update price and duration when tier changes
  useEffect(() => {
    if (form.title && promotionTiers[form.title]) {
      const { duration, price } = promotionTiers[form.title];
      setForm((prev) => ({
        ...prev,
        duration,
        price,
      }));
    }
  }, [form.title]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.clinicId || !form.title) {
      return toast.error(t("fill_required_fields"));
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("clinicId", form.clinicId);
      fd.append("title", form.title);
      fd.append("price", form.price);
      fd.append("duration", form.duration);
      
      if (form.customTitle) fd.append("customTitle", form.customTitle);
      if (form.customDescription) fd.append("customDescription", form.customDescription);
      if (image) fd.append("image", image);

      await API.post(`${API_URL}/promotions/clinic`, fd);

      toast.success(t("clinic_promotion_created_success"));
      navigate("/services");

    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(
        err.response?.data?.message || t("clinic_promotion_create_failed")
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingClinics) {
    return (
      <div className="pt-24 pb-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>{t("loading_clinics")}</p>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="pt-24 pb-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t("no_clinics_found")}</h2>
        <p className="text-gray-600 mb-6">{t("need_clinic_to_create_promotion")}</p>
        <button
          onClick={() => navigate("/clinic/create")}
          className="btn bg-caribbean text-white"
        >
          {t("create_clinic")}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 text-tufts px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-caribbean text-center">
        {t("create_clinic_promotion")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white shadow-lg rounded-xl border border-gray-100 space-y-6"
      >
        {/* Clinic Selection */}
        <div>
          <label className="font-semibold">{t("select_clinic")}</label>
          <select
            name="clinicId"
            value={form.clinicId}
            onChange={handleChange}
            className="select select-bordered w-full mt-1"
            required
          >
            <option value="" disabled>
              {t("choose_clinic")}
            </option>
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Promotion Tier */}
        <div>
          <label className="font-semibold">{t("promotion_tier")}</label>
          <select
            name="title"
            value={form.title}
            onChange={handleChange}
            className="select select-bordered w-full mt-1"
            required
          >
            <option value="" disabled>
              {t("select_promotion_tier")}
            </option>
            {Object.keys(promotionTiers).map((tier) => (
              <option key={tier} value={tier}>
                {t(tier)} - {promotionTiers[tier].price.toLocaleString()} TZS
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="font-semibold">{t("price")} (TZS)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            readOnly
            className="input input-bordered w-full mt-1 bg-gray-100 text-caribbean"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="font-semibold">{t("duration")} ({t("days")})</label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            readOnly
            className="input input-bordered w-full mt-1 bg-gray-100 text-caribbean"
          />
        </div>

        {/* Custom Title (Optional) */}
        <div>
          <label className="font-semibold">{t("custom_title")} ({t("optional")})</label>
          <input
            type="text"
            name="customTitle"
            placeholder={t("custom_promotion_title_placeholder")}
            value={form.customTitle}
            onChange={handleChange}
            className="input input-bordered w-full mt-1"
          />
        </div>

        {/* Custom Description (Optional) */}
        <div>
          <label className="font-semibold">{t("custom_description")} ({t("optional")})</label>
          <textarea
            name="customDescription"
            rows="4"
            placeholder={t("custom_promotion_description_placeholder")}
            value={form.customDescription}
            onChange={handleChange}
            className="textarea textarea-bordered w-full mt-1"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="font-semibold">{t("promotion_image")} ({t("optional")})</label>

          <div className="mt-2">
            <img
              src={imagePreview || "https://via.placeholder.com/400x200?text=Promotion+Image"}
              alt="Preview"
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn bg-caribbean text-white w-full mt-4"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("creating")}
            </span>
          ) : (
            t("create_clinic_promotion")
          )}
        </button>
      </form>
    </div>
  );
}
