import { useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import AuthForm from "../../components/auth/AuthForm";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error(t("passwords_mismatch"));
      return;
    }

    try {
      await API.post(`${API_URL}/auth/reset-password/${token}`, {
        newPassword: data.password,
      });

      setSuccess(true);
      toast.success(t("password_reset_success"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("reset_failed"));
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-white">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl text-caribbean font-bold mb-4">
            {t("password_updated")}
          </h2>
          <p className="mb-6 text-tufts">{t("can_now_login_with_new_password")}</p>
          <Link
            to="/login"
            className="bg-caribbean hover:bg-tufts text-white px-6 py-3 rounded-xl"
          >
            {t("go_to_login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      titleKey="reset_password_title"
      buttonLabelKey="reset_password_button"
      onSubmit={handleSubmit}
      fields={[
        { name: "password", labelKey: "new_password", type: "password" },
        { name: "confirmPassword", labelKey: "confirm_password", type: "password" },
      ]}
    />
  );
}
