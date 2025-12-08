import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";
import { getSponsoredProductById } from "../../api/admin";

export default function AdminProductSponsorshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    link: "",
    isActive: false,
    image: "",
    startAt: "",
    endAt: "",
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
        isActive: res.isActive || false,
        image: res.image || "",
        startAt: res.startAt ? res.startAt.substring(0, 10) : "",
        endAt: res.endAt ? res.endAt.substring(0, 10) : "",
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateProduct = async () => {
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("price", form.price);
      data.append("link", form.link);
      data.append("isActive", form.isActive);
      data.append("startAt", form.startAt);
      data.append("endAt", form.endAt);
      data.append("description", form.description);

      if (newImage) data.append("product", newImage);

      await API.put(`/admin/sponsored-products/${id}`, data);

      toast.success("Product updated!");
      loadProduct();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const deleteProduct = async () => {
    if (!confirm("Delete this sponsored product permanently?")) return;

    try {
      await API.delete(`/admin/sponsored-products/${id}`);
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
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Sponsorship...</p>
      </div>
    );
  }

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
          <h3 className="font-semibold mb-2">Product Information</h3>
          <p><b>Owner:</b> {product.owner.fullName}</p>
          <p><b>Name:</b> {product.name}</p>
          <p><b>Price:</b> {product.price}</p>
          <p><b>Link:</b> {product.link || "No link provided"}</p>

          <p><b>Description:</b> {product.description || "No description"}</p>

          <p><b>Start At:</b> {product.startAt ? product.startAt.substring(0,10) : "—"}</p>
          <p><b>End At:</b> {product.endAt ? product.endAt.substring(0,10) : "—"}</p>
        </div>

        {/* EDIT FORM */}
        <div className="bg-gray-100 p-4 rounded space-y-3 text-tufts">
          <h3 className="font-semibold mb-2 text-caribbean">Edit Product Details</h3>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="w-full border p-2 rounded"
          />

          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            className="w-full border p-2 rounded"
          />

          <input
            name="link"
            value={form.link}
            onChange={handleChange}
            placeholder="Link (optional)"
            className="w-full border p-2 rounded"
          />

          {/* DESCRIPTION */}
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full border p-2 rounded min-h-[80px]"
          />

          {/* DATE PICKERS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium">Start At</label>
              <input
                type="date"
                name="startAt"
                value={form.startAt}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="font-medium">End At</label>
              <input
                type="date"
                name="endAt"
                value={form.endAt}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          {/* ACTIVE STATUS */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            <span>Mark as Active</span>
          </label>

          {/* IMAGE UPLOAD */}
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

        {/* ACTION BUTTONS */}
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
