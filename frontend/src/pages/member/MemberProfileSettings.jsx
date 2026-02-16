import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/profile";
import LocationSelector from "../../components/membersetting/LocationSelector";
import InputField from "../../components/form/InputField";
import TextAreaField from "../../components/form/TextAreaField";
import AvatarUpload from "../../components/form/AvatarUpload";
import { useTranslation } from "react-i18next";

export default function MemberProfileSettings() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
    profileImageUrl: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
        profileImageUrl: user.profileImageUrl || "",
      });

      if (user.location) {
        setSelectedLocation({
          region: user.location.region || "",
          district: user.location.district || "",
          ward: user.location.ward || "",
          street: user.location.street || "",
        });
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords
    if (formData.password || formData.confirmPassword) {
      if (!formData.currentPassword) {
        toast.error(t("enter_current_password"));
        setLoading(false);
        return;
      }
      if (!formData.password) {
        toast.error(t("enter_new_password"));
        setLoading(false);
        return;
      }
      if (!formData.confirmPassword) {
        toast.error(t("confirm_new_password"));
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error(t("passwords_mismatch"));
        setLoading(false);
        return;
      }
      if (formData.currentPassword === formData.password) {
        toast.error(t("new_password_different"));
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        toast.error(t("password_min_length"));
        setLoading(false);
        return;
      }
    }

    try {
      const dataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value && key !== "confirmPassword" && key !== "profileImageUrl" && key !== "currentPassword") {
          dataToSend.append(key, value);
        }
        if (formData.password && key === "currentPassword" && value) {
          dataToSend.append(key, value);
        }
      });

      if (imageFile) dataToSend.append("avatar", imageFile);

      if (selectedLocation) {
        const geoJsonLocation = {
          type: "Point",
          coordinates: [0, 0],
          region: selectedLocation.region,
          district: selectedLocation.district,
          ward: selectedLocation.ward,
          street: selectedLocation.street,
        };
        dataToSend.append("location", JSON.stringify(geoJsonLocation));
      }

      const updatedUser = await updateProfile(dataToSend);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setFormData({
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        currentPassword: "",
        password: "",
        confirmPassword: "",
        profileImageUrl: updatedUser.profileImageUrl,
      });

      if (updatedUser.location) {
        setSelectedLocation({
          region: updatedUser.location.region || "",
          district: updatedUser.location.district || "",
          ward: updatedUser.location.ward || "",
          street: updatedUser.location.street || "",
        });
      }

      setImageFile(null);
      toast.success(t("profile_update_success"));
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error(err.response?.data?.error || t("profile_update_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alice mt-20 flex justify-center items-center px-4 py-8">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg p-6 md:p-10">
        <h2 className="text-2xl font-semibold text-tufts mb-6 text-center">
          {t("update_profile_title")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AvatarUpload
            profileImageUrl={formData.profileImageUrl}
            selectedFile={imageFile} 
            setImageFile={setImageFile}
          />

          <InputField
            label={t("full_name")}
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("email")}
              name="email"
              type="email"
              disabled
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label={t("phone")}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />

            <div className="col-span-1 md:col-span-2">
              <label className="font-semibold text-black mb-1 block">{t("location")}</label>
              <LocationSelector
                onLocationSelect={setSelectedLocation}
                initialLocation={selectedLocation}
              />
              {selectedLocation && (
                <p className="text-sm text-gray-500 mt-1">
                  {t("selected_location")}: {selectedLocation.region}, {selectedLocation.district}, {selectedLocation.ward}, {selectedLocation.street}
                </p>
              )}
            </div>
          </div>

          <TextAreaField
            label={t("bio")}
            name="bio"
            value={formData.bio}
            onChange={handleChange}
          />

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-tufts mb-4">{t("change_password_optional")}</h3>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {t("current_password")}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder={t("enter_current_password")}
                  className="input input-bordered w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">{t("new_password")}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("enter_new_password")}
                    className="input input-bordered w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t("password_min_length_hint")}</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">{t("confirm_new_password")}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t("confirm_new_password")}
                    className="input input-bordered w-full pr-10"
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
            </div>
          </div>

          <button
            type="submit"
            className={`btn bg-caribbean hover:bg-tufts text-white w-full font-semibold ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? t("saving") : t("save_changes")}
          </button>
        </form>
      </div>
    </div>
  );
}
