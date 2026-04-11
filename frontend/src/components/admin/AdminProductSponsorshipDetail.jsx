import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getSponsoredProductById, updateSponsoredProduct, updateSponsoredProductWithCacheInvalidation, deleteSponsoredProduct } from "../../api/admin";

import { X, Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next'
import toast from "react-hot-toast";
import { useHomePage } from "../../contexts/HomePageContext";

const CATEGORIES = ["equipment", "digital", "services", "others"];

export default function AdminProductSponsorshipDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    link: "",
    category: "services",
    isActive: false,
    image: "",
    description: "",
  });

  const [newImage, setNewImage] = useState(null);
  const { t } = useTranslation()
  const { forceRefreshHomePage } = useHomePage();

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await getSponsoredProductById(id);

      setProduct(res);

      setForm({
        name: res.name || "",
        price: res.price || "",
        link: res.link || "",
        category: res.category || "services",
        isActive: res.isActive || false,
        image: res.image || "",
        description: res.description || "",
      });
    } catch (err) {
      console.error(err);
      toast.error(t('failed_load_product'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateProduct = async () => {
    try {
      setSaving(true);
      const data = new FormData();
      data.append("name", form.name);
      data.append("price", form.price);
      data.append("link", form.link);
      data.append("category", form.category);
      data.append("description", form.description);

      // ✅ Only send isActive if approved
      if (product.status === "approved") {
        data.append("isActive", String(form.isActive));
      }

      if (newImage) data.append("product", newImage);

      if (newImage && newImage.size > 2 * 1024 * 1024) {
        return toast.error(t("image_size_limit"));
      }

      await updateSponsoredProductWithCacheInvalidation(id, data, forceRefreshHomePage);

      toast.success(t('product_updated'));
      loadProduct();
    } catch (err) {
      toast.error(err.response?.data?.error || t('update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!confirm(t('confirm_delete_product'))) return;

    try {
      setDeleting(true);
      await deleteSponsoredProduct(id);
      toast.success(t('product_deleted'));
      navigate(-1);
    } catch (err) {
      toast.error(t('delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t('loading_sponsored_products')}
        </p>
      </div>
    );
  }
  // STATUS BADGE UPDATE
  const isExpired = product?.endDate && new Date(product.endDate) < new Date();

  const StatusBadge = ({ status, expired }) => {
    let color = "bg-gray-400";

    if (expired) color = "bg-gray-600";
    else if (status === "approved") color = "bg-green-600";
    else if (status === "pending") color = "bg-yellow-500";
    else if (status === "rejected") color = "bg-red-600";

    return (
      <span className={`px-2 py-1 text-xs rounded text-white ${color}`}>
        {expired ? "Expired" : status.toUpperCase()}
      </span>
    );
  };

  const updateStatus = async (status) => {
    try {
      setSavingStatus(true);
      await updateSponsoredProductWithCacheInvalidation(id, { status }, forceRefreshHomePage);
      toast.success(`Product ${status}`);
      loadProduct();
    } catch (err) {
      toast.error(err.response?.data?.error || "Status update failed");
    } finally {
      setSavingStatus(false);
    }
  };
console.log(product)
  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-lg text-caribbean">
          {t('manage_sponsored_product')} — {product.name}
        </h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-500 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-6 text-sm">
        {/* PRODUCT INFO */}
        <div className="bg-gray-100 p-3 rounded text-tufts">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            {t('product_information')}
            <StatusBadge status={product.status} expired={isExpired} />
          </h3>

          <p><b>{t('owner_label')}</b> {product.owner?.fullName}</p>
          <p><b>{t('category_label')}</b> {product.category}</p>
          <p><b>{t('active_label')}</b> {product.isActive ? t('yes') : t('no')}</p>

          <p>
            <b>{t('start_date')}</b>{" "}
            {product.startDate ? product.startDate.substring(0, 10) : "—"}
          </p>

          <p>
            <b>{t('end_date')}</b>{" "}
            {product.endDate ? product.endDate.substring(0, 10) : "—"}
          </p>

          {isExpired && (
            <p className="text-red-600 font-medium mt-2">
              ⚠ {t('sponsorship_expired')}
            </p>
          )}
        </div>


        {/* EDIT FORM */}
        {product.status === "pending" && (
          <div className="flex gap-3 mb-4">
            <button
              disabled={savingStatus}
              onClick={() => updateStatus("approved")}
              className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {savingStatus ? t('approving') : t('approve_sponsorship')}
            </button>

            <button
              onClick={() => updateStatus("rejected")}
              className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {t('reject_sponsorship')}
            </button>
          </div>
        )}

        <div className="bg-gray-100 p-4 rounded space-y-3 text-tufts">
          <h3 className="font-semibold mb-2 text-caribbean">
            {t('edit_product_details')}
          </h3>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t('product_name_placeholder')}
            className="w-full border p-2 rounded"
          />

          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder={t('price_placeholder')}
            className="w-full border p-2 rounded"
          />

          {/* CATEGORY DROPDOWN */}
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <input
            name="link"
            value={form.link}
            onChange={handleChange}
            placeholder={t('link_placeholder')}
            className="w-full border p-2 rounded"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={t('description_placeholder')}
            className="w-full border p-2 rounded min-h-[80px]"
          />

          {/* ACTIVE */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={product.status !== "approved"}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
            />
            <span className={product.status !== "approved" ? "text-gray-400" : ""}>
              {t('mark_as_active')}
            </span>
          </label>


          {/* IMAGE */}
          <div>
            <p className="font-medium mb-1">{t('product_image_label')}</p>

            {form.image && (
              <img
                src={form.image}
                alt="Product"
                className="w-24 h-24 rounded object-cover mb-2 border"
              />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            disabled={saving}
            onClick={updateProduct}
            className="w-full py-2 bg-caribbean text-white rounded hover:bg-caribbean-dark"
          >
            {saving ? t('saving') : t('save_changes')}
          </button>

          <button
            disabled={deleting}
            onClick={deleteProduct}
            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {deleting ? t('deleting') : t('delete_product')}
          </button>
        </div>
      </div>
    </div>
  );
}
