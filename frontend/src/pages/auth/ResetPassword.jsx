import { useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../api/auth";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const formData = new FormData(e.target);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      toast.error(t("passwords_mismatch"));
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);

      setSuccess(true);
      toast.success(t("password_reset_success"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("reset_failed"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-white">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl text-caribbean font-bold mb-4">
            {t("password_updated")}
          </h2>
          <p className="mb-6 text-tufts">
            {t("can_now_login_with_new_password")}
          </p>
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
    <div className="flex items-center justify-center min-h-screen text-tufts bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-caribbean mb-6 text-center">
          {t("reset_password_title")}
        </h2>

        {/* New Password */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1">
            {t("new_password")}
          </label>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full border rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-caribbean"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="mb-6 relative">
          <label className="block text-sm font-medium mb-1">
            {t("confirm_password")}
          </label>
          <input
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            required
            className="w-full border rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-caribbean"
          />
          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-3 top-9 text-gray-500"
          >
            {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-caribbean hover:bg-tufts text-white py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? t("resetting") : t("reset_password_button")}
        </button>
      </form>
    </div>
  );
}