import React, { useState } from "react";
import { ChevronDown, Eye, EyeOff, Key } from "lucide-react";
import { toast } from "react-hot-toast";
import { changePassword } from "../../api/auth";
import { useTranslation } from "react-i18next";

const PasswordChangeSection = () => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validatePasswords = () => {
    if (!formData.oldPassword) {
      toast.error(t("enter_current_password"));
      return false;
    }
    if (!formData.newPassword) {
      toast.error(t("enter_new_password"));
      return false;
    }
    if (!formData.confirmPassword) {
      toast.error(t("confirm_new_password"));
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t("passwords_do_not_match"));
      return false;
    }
    if (formData.oldPassword === formData.newPassword) {
      toast.error(t("new_password_differs"));
      return false;
    }
    if (formData.newPassword.length < 6) {
      toast.error(t("password_min_length"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) return;

    setLoading(true);
    try {
      await changePassword(formData.oldPassword, formData.newPassword);

      toast.success(t("password_changed_success"));
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setIsOpen(false);
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(err.response?.data?.error || t("failed_change_password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean flex items-center gap-2">
          <Key className="w-5 h-5" />
          {t("change_password")}
        </h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t("current_password")}
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder={t("enter_current_password")}
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t("new_password")}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder={t("enter_new_password")}
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("password_min_length")}</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t("confirm_new_password")}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t("confirm_new_password")}
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
              }}
              className="btn bg-red-300 flex-1 hover:bg-red-400 text-white"
              disabled={loading}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn bg-caribbean text-white hover:bg-tufts flex-1"
              disabled={loading}
            >
              {loading ? t("updating") : t("update_password")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PasswordChangeSection;
