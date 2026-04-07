import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { createPTPromotion } from "../../api/promotions";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CreatePromotion() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user.role !== "physiotherapist") {
    return (
      <div className="pt-24 pb-16 text-center">
        <h2 className="text-2xl font-bold">{t("access_denied")}</h2>
        <p className="text-gray-600">
          {t("only_physio_create_promotion")}
        </p>
      </div>
    );
  }

  const promotionOptions = {
    silver: { duration: "7_days", price: 20000 },
    gold: { duration: "14_days", price: 50000 },
    platinum: { duration: "30_days", price: 100000 },
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (form.title && promotionOptions[form.title]) {
      const { duration, price } = promotionOptions[form.title];
      setForm((prev) => ({
        ...prev,
        duration: t(duration),
        price,
        description: "",
      }));
    }
  }, [form.title, t]);

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

    if (!form.title || !form.description) {
      return toast.error(t("fill_required_fields"));
    }

    try {
      setLoading(true);

      const fd = new FormData();

      // Fix title case
      const formattedTitle =
        form.title.charAt(0).toUpperCase() + form.title.slice(1);

      fd.append("title", formattedTitle);
      fd.append("description", form.description);

      if (image) fd.append("ptPromotion", image);

      await createPTPromotion(fd);

      toast.success(t("promotion_created_success"));
      navigate("/services");

    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(
        err.response?.data?.error || t("promotion_create_failed")
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="pt-24 pb-16 text-tufts px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-caribbean text-center">
        {t("create_promotion")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white shadow-lg rounded-xl border border-gray-100 space-y-6"
      >
        {/* Title */}
        <div>
          <label className="font-semibold">{t("title")}</label>
          <select
            name="title"
            value={form.title}
            onChange={handleChange}
            className="select select-bordered w-full mt-1"
            required
          >
            <option value="" disabled>
              {t("select_promotion_level")}
            </option>
            {Object.keys(promotionOptions).map((level) => (
              <option key={level} value={level}>
                {t(level)}
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
          <label className="font-semibold">{t("duration")}</label>
          <input
            type="text"
            name="duration"
            value={form.duration}
            readOnly
            className="input input-bordered w-full mt-1 bg-gray-100 text-caribbean"
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-semibold">{t("description")}</label>
          <textarea
            name="description"
            rows="4"
            placeholder={t("promotion_description_placeholder")}
            value={form.description}
            onChange={handleChange}
            className="textarea textarea-bordered w-full mt-1"
            required
          ></textarea>
        </div>

        {/* Image Upload */}
        <div>
          <label className="font-semibold">{t("promotion_image")}</label>

          <div className="mt-2">
            <img
              src={imagePreview || user.profileImageUrl}
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
            t("create_promotion")
          )}
        </button>
      </form>
    </div>
  );
}
