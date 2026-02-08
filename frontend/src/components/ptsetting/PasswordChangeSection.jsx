import React, { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";

const PasswordChangeSection = () => {
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
      toast.error("Please enter your current password");
      return false;
    }
    if (!formData.newPassword) {
      toast.error("Please enter a new password");
      return false;
    }
    if (!formData.confirmPassword) {
      toast.error("Please confirm your new password");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }
    if (formData.oldPassword === formData.newPassword) {
      toast.error("New password must be different from your current password");
      return false;
    }
    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      await API.post(`${API_URL}/auth/change-password`, {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      toast.success("Password changed successfully!");
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(err.response?.data?.error || "Failed to change password");
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
        <h2 className="text-xl font-bold text-caribbean">Change Password</h2>
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
              Current Password
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showOldPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              At least 6 characters required
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFormData({
                  oldPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
              className="btn bg-red-300 flex-1 hover:bg-red-400 text-white"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-caribbean text-white hover:bg-tufts flex-1"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PasswordChangeSection;
