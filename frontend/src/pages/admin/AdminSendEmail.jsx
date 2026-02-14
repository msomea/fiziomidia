import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const AdminSendEmail = () => {
  const { id } = useParams(); // user ID from route
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    buttonText: "",
    buttonURL: "",
    logoURL: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.title || !formData.body) {
      toast.error("Title and Body are required");
      setLoading(false);
      return;
    }

    try {
      const response = await API.post(
        `${API_URL}/admin/users/${id}/email`,
        formData
      );

      if (response.data.success) {
        toast.success(response.data.message || "Email sent successfully");
        navigate("/dashboard/admin");
      } else {
        toast.error(response.data.message || "Failed to send email");
      }
    } catch (err) {
      console.error("Send email failed:", err);
      toast.error(err.response?.data?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl text-caribbean font-semibold text-center mb-6">
          Send Email to User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Email Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border rounded-lg p-2"
            required
          />

          <textarea
            placeholder="Email Body (HTML allowed)"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="w-full border rounded-lg p-2 h-32"
            required
          />

          <input
            type="text"
            placeholder="Button Text (Optional)"
            value={formData.buttonText}
            onChange={(e) =>
              setFormData({ ...formData, buttonText: e.target.value })
            }
            className="w-full border rounded-lg p-2"
          />

          <input
            type="url"
            placeholder="Button URL (Optional)"
            value={formData.buttonURL}
            onChange={(e) =>
              setFormData({ ...formData, buttonURL: e.target.value })
            }
            className="w-full border rounded-lg p-2"
          />

          <input
            type="url"
            placeholder="Logo URL (Optional)"
            value={formData.logoURL}
            onChange={(e) =>
              setFormData({ ...formData, logoURL: e.target.value })
            }
            className="w-full border rounded-lg p-2"
          />

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/admin/users")}
              className="px-4 py-2 bg-red-400 text-white border rounded-lg hover:bg-red-700"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`px-4 py-2 bg-caribbean text-white rounded-lg hover:bg-[#03bb74] flex items-center gap-2 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" /> Sending...
                </>
              ) : (
                "Send Email"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSendEmail;
