import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { toast } from "react-hot-toast";
import { ImagePlus, Loader2 } from "lucide-react";

export default function CreatePromotion() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user.role !== "physiotherapist") {
    return (
      <div className="pt-24 pb-16 text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-gray-600">Only physiotherapists can create promotions.</p>
      </div>
    );
  }

  const promotionOptions = {
    Silver: { duration: "7 days", price: 20000 },
    Gold: { duration: "2 weeks", price: 50000 },
    Platinum: { duration: "1 month", price: 100000 },
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

  // Update price/duration when title changes
  useEffect(() => {
    if (form.title && promotionOptions[form.title]) {
      const { duration, price } = promotionOptions[form.title];
      setForm((prev) => ({ ...prev, duration, price }));
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

    if (!form.title || !form.description) {
      return toast.error("Please fill all required fields");
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("price", form.price);
      fd.append("duration", form.duration);

      // Only append image if user uploaded one
      if (image) fd.append("image", image);

      await API.post(`${API_URL}/promotions/create`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Promotion created successfully!");
      navigate("/services");
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
          <select
            name="title"
            value={form.title}
            onChange={handleChange}
            className="select select-bordered w-full mt-1"
            required
          >
            <option value="" disabled>
              Select Promotion Level
            </option>
            {Object.keys(promotionOptions).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="font-semibold">Price (TZS)</label>
          <input
            type="number"
            name="price"
            placeholder="Enter price"
            value={form.price}
            readOnly
            className="input input-bordered w-full mt-1 bg-gray-100 text-caribbean"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="font-semibold">Duration</label>
          <input
            type="text"
            name="duration"
            placeholder="Duration"
            value={form.duration}
            readOnly
            className="input input-bordered w-full mt-1 bg-gray-100 text-caribbean"
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
              <img
                src={user.profileImageUrl} // fallback to user profile
                alt="Profile Fallback"
                className="w-full h-48 object-cover rounded-lg border"
              />
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="file-input file-input-bordered w-full mt-3"
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
