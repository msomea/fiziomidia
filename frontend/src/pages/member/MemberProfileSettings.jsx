import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile, updateLanguage } from "../../api/users";
import LocationSelector from "../../components/location/LocationSelector";
import InputField from "../../components/form/InputField";
import TextAreaField from "../../components/form/TextAreaField";
import AvatarUpload from "../../components/form/AvatarUpload";
import ClinicManagement from "../../components/membersetting/ClinicManagement";
import { useTranslation } from "react-i18next";

export default function MemberProfileSettings() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
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

  // New state for selected language
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
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

      if (user.language) setSelectedLanguage(user.language);
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

  // New function to update language
  const handleLanguageUpdate = async () => {
    if (selectedLanguage === user.language) {
      toast(t("no_language_change"));
      return;
    }

    setLanguageLoading(true);
    try {
      const data = await updateLanguage(selectedLanguage);

      if (data.success) {
        const updatedUser = { ...user, language: data.language };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        i18n.changeLanguage(data.language);
        toast.success(t("language_updated_success"));
        setLanguageOpen(false);
      }
    } catch (err) {
      console.error("Language update error:", err);
      toast.error(err.response?.data?.error || t("failed_update_language"));
    } finally {
      setLanguageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alice mt-20 flex justify-center items-start px-4 py-8">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg p-6 md:p-10 space-y-6">
        <h2 className="text-2xl font-semibold text-tufts mb-6 text-center">
          {t("update_profile_title")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
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
              readOnly={true}
              value={user?.email}
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

          {/* Default Language Section */}
          <div className="border-t mt-8 pt-6">
            <button
              type="button"
              onClick={() => setLanguageOpen(!languageOpen)}
              className="w-full flex justify-between items-center font-semibold text-tufts mb-2"
            >
              {t("default_language")}
              <span className={`text-caribbean transition-transform duration-300 ${languageOpen ? "rotate-180" : ""}`}>▼</span>
            </button>

            {languageOpen && (
              <div className="space-y-4 mt-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="en">{t("english")}</option>
                  <option value="sw">{t("swahili")}</option>
                </select>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(user.language);
                      setLanguageOpen(false);
                    }}
                    className="btn bg-red-300 flex-1 hover:bg-red-400 text-white"
                    disabled={languageLoading}
                  >
                    {t("cancel")}
                  </button>

                  <button
                    type="button"
                    onClick={handleLanguageUpdate}
                    className="btn bg-caribbean flex-1 text-white hover:bg-tufts"
                    disabled={languageLoading}
                  >
                    {languageLoading ? t("updating") : t("update_language")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password Section */}
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

          {/* Save Profile Button */}
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

        {/* Clinic Management Section */}
        <div className="mt-8">
          <ClinicManagement user={user} t={t} />
        </div>

        
      </div>
    </div>
  );
}