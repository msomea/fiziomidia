import { useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import AuthForm from "../../components/auth/AuthForm";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Added loading state
  const { t } = useTranslation();

  const handleSubmit = async (data) => {
    if (loading) return; // ✅ Prevent double click

    setLoading(true); // ✅ Start sending

    try {
      await API.post(`${API_URL}/auth/forgot-password`, {
        email: data.email,
      });

      setSent(true);
      toast.success(t("reset_link_sent"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("something_went_wrong"));
    } finally {
      setLoading(false); // ✅ Stop sending
    }
  };

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl text-caribbean font-bold mb-4">
            {t("check_your_email")}
          </h2>
          <p className="text-gray-700">
            {t("forgot_password_email_desc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      titleKey="forgot_password_title"
      buttonLabelKey={loading ? (t("sending")) : "send_reset_link"} // ✅ Dynamic label
      onSubmit={handleSubmit}
      isLoading={loading} // ✅ Pass loading to form
      fields={[
        {
          name: "email",
          labelKey: "email_label",
          type: "email",
          placeholder: t("enter_your_email"),
        },
      ]}
    />
  );
}