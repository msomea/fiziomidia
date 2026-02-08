import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { toast } from "react-hot-toast";
import { ImagePlus, Loader2 } from "lucide-react";

export default function CreatePromotion() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only physiotherapists allowed
  if (user.role !== "physiotherapist") {
    return (
      <div className="pt-24 pb-16 text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-gray-600">Only physiotherapists can create promotions.</p>
      </div>
    );
  }

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle image
  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.price || !form.duration) {
      return toast.error("Please fill all fields");
    }
    if (!image) return toast.error("Please upload an image");

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("price", form.price);
      fd.append("duration", form.duration);
      fd.append("image", image);

      await API.post(`${API_URL}/services/promotions/create`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Promotion created successfully!");
      navigate("/services/promotions");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 text-tufts px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-caribbean text-center">
        Create Promotion
      </h1>

      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white shadow-lg rounded-xl border border-gray-100 space-y-6"
      >
        {/* Title */}
        <div>
          <label className="font-semibold">Title</label>
          <input
            type="text"
            name="title"
            placeholder="Promotion title"
            value={form.title}
            onChange={handleChange}
            className="input input-bordered w-full mt-1"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label className="font-semibold">Price (TZS)</label>
          <input
            type="number"
            name="price"
            placeholder="Enter price"
            value={form.price}
            onChange={handleChange}
            className="input input-bordered w-full mt-1"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className="font-semibold">Duration</label>
          <input
            type="text"
            name="duration"
            placeholder="1 week, 2 weeks, 30 days..."
            value={form.duration}
            onChange={handleChange}
            className="input input-bordered w-full mt-1"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-semibold">Description</label>
          <textarea
            name="description"
            rows="4"
            placeholder="Describe the promotion details"
            value={form.description}
            onChange={handleChange}
            className="textarea textarea-bordered w-full mt-1"
            required
          ></textarea>
        </div>

        {/* Image Upload */}
        <div>
          <label className="font-semibold">Promotion Image</label>

          <div className="mt-2">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center border rounded-lg">
                <ImagePlus className="text-gray-400 w-10 h-10" />
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="file-input file-input-bordered w-full mt-3"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn bg-caribbean text-white w-full mt-4"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Creating...
            </span>
          ) : (
            "Create Promotion"
          )}
        </button>
      </form>
    </div>
  );
}
