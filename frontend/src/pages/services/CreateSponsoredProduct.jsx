import React, { useState } from "react";
import API from "../../api/axios";
import { toast } from "react-hot-toast";
import { API_URL } from "../../config/constants";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router";

const CreateSponsoredProduct = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return toast.error("Please upload a product image");

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("product", image);

    try {
      setLoading(true);
      const res = await API.post("/sponsored-products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Sponsored product created successfully!. Wait for Admin approval.");
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
        navigate(-1); // go back to previous page
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl text-tufts mx-auto mt-20 bg-white p-6 shadow rounded-xl">
      <h1 className="text-2xl text-caribbean font-bold mb-4">Create Sponsored Product</h1>

      <form onSubmit={handleSubmit}>

        {/* Title */}
        <label className="block mb-2 font-medium">Product Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder="Enter product name"
        />

        {/* Category */}
        <label className="block mb-2 font-medium">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="">Select category</option>
          <option value="equipment">Physio Equipment</option>
          <option value="digital">Digital Products</option>
          <option value="services">Health Services</option>
          <option value="others">Others</option>
        </select>

        {/* Price */}
        <label className="block mb-2 font-medium">Price (TZS)</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder="Enter product price"
        />

        {/* Duration */}
        <label className="block mb-2 font-medium">Promotion Duration (Days)</label>
        <input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder="e.g., 7, 14, 30"
        />

        {/* Link */}
        <label className="block mb-2 font-medium">Product Link (Optional)</label>
        <input
          type="text"
          name="link"
          value={formData.link}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          placeholder="URL where users can view or buy"
        />

        {/* Description */}
        <label className="block mb-2 font-medium">Product Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          rows="4"
          placeholder="Enter product description"
        ></textarea>

        {/* Image Upload */}
        <label className="block mb-2 font-medium">Upload Product Image</label>
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
          Create Sponsored Product
        </button>
      </form>
    </div>
  );
};

export default CreateSponsoredProduct;
