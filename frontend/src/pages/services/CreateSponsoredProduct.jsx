import React, { useState } from "react";
import { createSponsoredProduct } from "../../api/promotions";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const CreateSponsoredProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    duration: "",
    link: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push(t("product_name_required"));
    }

    if (!formData.category) {
      errors.push(t("category_required"));
    }

    if (!formData.description.trim()) {
      errors.push(t("product_description_required"));
    }

    if (!formData.price || formData.price <= 0) {
      errors.push(t("price_required"));
    }

    if (!formData.duration || formData.duration <= 0) {
      errors.push(t("duration_required"));
    }

    if (!image) {
      errors.push(t("upload_product_image_error"));
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("product", image);

    try {
      setLoading(true);
      const result = await createSponsoredProduct(data);

      if (result.success) {
        toast.success(t("sponsored_product_created_success"));
        setFormData({
          name: "",
          category: "",
          description: "",
          price: "",
          duration: "",
          link: "",
        });
        setImage(null);
        setPreview(null);
        navigate(-1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("something_went_wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl text-tufts mx-auto mt-20 bg-white p-6 shadow rounded-xl">
      <h1 className="text-2xl text-caribbean font-bold mb-4">
        {t("create_sponsored_product")}
      </h1>

      <form onSubmit={handleSubmit}>

        {/* Title */}
        <label className="block mb-2 font-medium">{t("product_name")}</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder={t("enter_product_name")}
        />

        {/* Category */}
        <label className="block mb-2 font-medium">{t("category")}</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="">{t("select_category")}</option>
          <option value="equipment">{t("physio_equipment")}</option>
          <option value="digital">{t("digital_products")}</option>
          <option value="services">{t("health_services")}</option>
          <option value="others">{t("others")}</option>
        </select>

        {/* Price */}
        <label className="block mb-2 font-medium">{t("price_tzs")}</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder={t("enter_product_price")}
        />

        {/* Duration */}
        <label className="block mb-2 font-medium">{t("promotion_duration_days")}</label>
        <input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder={t("duration_placeholder")}
        />

        {/* Link */}
        <label className="block mb-2 font-medium">{t("product_link_optional")}</label>
        <input
          type="text"
          name="link"
          value={formData.link}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder={t("product_link_placeholder")}
        />

        {/* Description */}
        <label className="block mb-2 font-medium">{t("product_description")}</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          rows="4"
          placeholder={t("enter_product_description")}
        ></textarea>

        {/* Image Upload */}
        <label className="block mb-2 font-medium">{t("upload_product_image")}</label>
        <input type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            className="w-40 h-40 object-cover rounded-lg mb-4 border"
            alt="Preview"
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full p-3 rounded-lg flex justify-center items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" />}
          {t("create_sponsored_product")}
        </button>
      </form>
    </div>
  );
};

export default CreateSponsoredProduct;
