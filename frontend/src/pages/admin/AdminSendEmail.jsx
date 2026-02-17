import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminSendEmail = () => {
  const { t } = useTranslation();
  const { id } = useParams(); // user ID from route
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    buttonText: "",
    buttonURL: "",
    logoURL: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.title || !formData.body) {
      toast.error(t("title_body_required"));
      setLoading(false);
      return;
    }

    try {
      const response = await API.post(
        `${API_URL}/admin/users/${id}/email`,
        formData
      );

      if (response.data.success) {
        toast.success(response.data.message || t("email_sent_success"));
        navigate("/dashboard/admin");
      } else {
        toast.error(response.data.message || t("email_send_failed"));
      }
    } catch (err) {
      console.error("Send email failed:", err);
      toast.error(err.response?.data?.message || t("email_send_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl text-caribbean font-semibold text-center mb-6">
          {t("send_email_to_user")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t("email_title")}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full border rounded-lg p-2"
            required
          />

          <textarea
            placeholder={t("email_body")}
            value={formData.body}
            onChange={(e) =>
              setFormData({ ...formData, body: e.target.value })
            }
            className="w-full border rounded-lg p-2 h-32"
            required
          />

          <input
            type="text"
            placeholder={t("button_text_optional")}
            value={formData.buttonText}
            onChange={(e) =>
              setFormData({ ...formData, buttonText: e.target.value })
            }
            className="w-full border rounded-lg p-2"
          />

          <input
            type="url"
            placeholder={t("button_url_optional")}
            value={formData.buttonURL}
            onChange={(e) =>
              setFormData({ ...formData, buttonURL: e.target.value })
            }
            className="w-full border rounded-lg p-2"
          />

          <input
            type="url"
            placeholder={t("logo_url_optional")}
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
              {t("cancel")}
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
                  <Loader2 className="animate-spin w-4 h-4" /> {t("sending")}
                </>
              ) : (
                t("send_email")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSendEmail;
