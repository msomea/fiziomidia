import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";
import { getSponsoredProductById } from "../../api/admin";

const CATEGORIES = ["equipment", "digital", "services", "others"];

export default function AdminProductSponsorshipDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

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
      toast.error("Failed to load product");
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
      const data = new FormData();
      data.append("name", form.name);
      data.append("price", form.price);
      data.append("link", form.link);
      data.append("category", form.category);
      data.append("description", form.description);

      // ✅ Only send isActive if approved
      if (product.status === "approved") {
        data.append("isActive", form.isActive);
      }

      if (newImage) data.append("image", newImage);

      await API.put(`${API_URL}/admin/sponsored-products/${id}`, data);

      toast.success("Product updated");
      loadProduct();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const deleteProduct = async () => {
    if (!confirm("Delete this sponsored product permanently?")) return;

    try {
      await API.delete(`${API_URL}/admin/sponsored-products/${id}`);
      toast.success("Product deleted");
      navigate(-1);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (loading || !product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          Loading Sponsored products…
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
      await API.put(`/admin/sponsored-products/${id}`, { status });
      toast.success(`Product ${status}`);
      loadProduct();
    } catch (err) {
      toast.error(err.response?.data?.error || "Status update failed");
    }
  };


  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-lg text-caribbean">
          Manage Sponsored Product — {product.name}
        </h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-500 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-6 text-sm">
        {/* PRODUCT INFO */}
        <div className="bg-gray-100 p-3 rounded text-tufts">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            Product Information
            <StatusBadge status={product.status} expired={isExpired} />
          </h3>

          <p><b>Owner:</b> {product.owner?.fullName}</p>
          <p><b>Category:</b> {product.category}</p>
          <p><b>Active:</b> {product.isActive ? "Yes" : "No"}</p>

          <p>
            <b>Start Date:</b>{" "}
            {product.startDate ? product.startDate.substring(0, 10) : "—"}
          </p>

          <p>
            <b>End Date:</b>{" "}
            {product.endDate ? product.endDate.substring(0, 10) : "—"}
          </p>

          {isExpired && (
            <p className="text-red-600 font-medium mt-2">
              ⚠ This sponsorship has expired
            </p>
          )}
        </div>


        {/* EDIT FORM */}
        {product.status === "pending" && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => updateStatus("approved")}
              className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve Sponsorship
            </button>

            <button
              onClick={() => updateStatus("rejected")}
              className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject Sponsorship
            </button>
          </div>
        )}

        <div className="bg-gray-100 p-4 rounded space-y-3 text-tufts">
          <h3 className="font-semibold mb-2 text-caribbean">
            Edit Product Details
          </h3>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="w-full border p-2 rounded"
          />

          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
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
            placeholder="Link (optional)"
            className="w-full border p-2 rounded"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
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
              Mark as Active (Approved only)
            </span>
          </label>


          {/* IMAGE */}
          <div>
            <p className="font-medium mb-1">Product Image</p>

            {form.image && (
              <img
                src={`${API_URL}${form.image}`}
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
            onClick={updateProduct}
            className="w-full py-2 bg-caribbean text-white rounded hover:bg-caribbean-dark"
          >
            Save Changes
          </button>

          <button
            onClick={deleteProduct}
            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}
