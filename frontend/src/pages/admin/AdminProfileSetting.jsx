import React, { useState } from "react";
import { useNavigate } from "react-router";
import { updateProfile } from "../../api/users";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import AdminLanguage from "../../components/admin/AdminLanguage";

const AdminProfile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    language: user.language || "sw"
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error(t("passwords_mismatch"));
      setLoading(false);
      return;
    }

    try {
      const body = new FormData();
      body.append("fullName", formData.fullName);
      body.append("email", formData.email);
      if (formData.newPassword) body.append("password", formData.newPassword);
      if (avatarFile) body.append("avatar", avatarFile);

      const response = await updateProfile(body);

      const updatedUser = response.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success(t("profile_updated"));
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.response?.data?.error || t("failed_update_profile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl text-caribbean font-semibold text-center mb-6">
          {t("admin_profile_title")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <input
            type="text"
            placeholder={t("full_name")}
            value={formData.fullName}
            className="w-full border rounded-lg p-2"
            disabled
          />

          {/* Email */}
          <input
            type="email"
            placeholder={t("email_label")}
            value={formData.email}
            className=" w-full border rounded-lg p-2"
            disabled
          />

          {/* Current Password */}
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              placeholder={t("current_password")}
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              className="w-full border rounded-lg p-2 pr-10"
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? <EyeOff /> : <Eye />}
            </span>
          </div>

          {/* New Password */}
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder={t("new_password")}
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className="w-full border rounded-lg p-2 pr-10"
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff /> : <Eye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder={t("confirm_new_password")}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full border rounded-lg p-2 pr-10"
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff /> : <Eye />}
            </span>
          </div>

          {/* Language Change */}
          <AdminLanguage />

          {/* Avatar Upload */}
          <div>
            <label className="block text-tufts font-medium mb-1">{t("change_profile_image")}</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => setAvatarFile(e.target.files[0])}
              className="w-full border rounded-lg p-2"
            />
            <p className="text-sm text-gray-500 mt-1">{t("accepted_image_types")}</p>
            {user.profileImageUrl && (
              <img
                src={user.profileImageUrl}
                alt={t("current_avatar")}
                className="w-24 h-24 rounded-full mt-2 object-cover"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/admin")}
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
                  <Loader2 className="animate-spin w-4 h-4" /> {t("updating")}
                </>
              ) : (
                t("update_profile")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
