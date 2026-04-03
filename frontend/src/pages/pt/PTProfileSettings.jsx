import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../api/profile";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ProfileHeader from "../../components/ptsetting/ProfileHeader";
import OverviewSection from "../../components/ptsetting/OverviewSection";
import LicenseInfo from "../../components/ptsetting/LicenseInfo";
import Services from "../../components/ptsetting/Services";
import Experience from "../../components/ptsetting/Experience";
import Education from "../../components/ptsetting/Education";
import WorkingHours from "../../components/ptsetting/WorkingHours";
import AvailabilitySection from "../../components/ptsetting/AvailabilitySection";
import PasswordChangeSection from "../../components/ptsetting/PasswordChangeSection";
import GallerySection from "../../components/ptsetting/GallerySection";
import SaveButton from "../../components/ptsetting/SaveButton";
import LocationSelector from "../../components/ptsetting/LocationSelector";
import DefaultLanguageSection from "../../components/ptsetting/DefaultLanguageSection";
import ClinicManagement from "../../components/ptsetting/ClinicManagement";

const PTProfileSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: [],
    bio: "",
    title: "",
    services: [],
    workExperience: "",
    education: "",
    gallery: [],
    availability: "",
    institution: "",
    licenses: [],
    speciality: [],
    yearsOfExperience: "",
    isPrivatePractice: true,
    profileImageUrl: "",
    languages: [],
    professionalMemberships: [],
    documents: [],
    clinicIds: [],
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getProfile();
        setFormData({
          fullName: profileData.fullName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          profileImageUrl: profileData.profileImageUrl || "",
          bio: profileData.bio || "",
          location: profileData.location || [],
          coordinates: profileData.location?.coordinates || [0, 0],
          region: profileData.location?.region || "",
          district: profileData.location?.district || "",
          ward: profileData.location?.ward || "",
          street: profileData.location?.street || "",
          title: profileData.ptProfile?.title || "",
          institution: profileData.ptProfile?.institution || "",
          isPrivatePractice: profileData.ptProfile?.isPrivatePractice ?? true,
          clinicIds: profileData.ptProfile?.clinicIds || [],
          speciality: profileData.ptProfile?.speciality || [],
          yearsOfExperience: profileData.ptProfile?.yearsOfExperience || "",
          services: profileData.ptProfile?.services || [],
          education: profileData.ptProfile?.education || [],
          workExperience: profileData.ptProfile?.workExperience || [],
          languages: profileData.ptProfile?.languages || [],
          gallery: profileData.ptProfile?.gallery || [],
          workingHours: profileData.ptProfile?.workingHours || [],
          availability: profileData.ptProfile?.availability || { isAcceptingNewPatients: true, nextAvailableDate: "" },
          licenses: profileData.ptProfile?.licenses || [],
          professionalMemberships: profileData.ptProfile?.professionalMemberships || [],
          documents: profileData.ptProfile?.documents || [],
        });
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error(t("profile_load_failed"));
      }
    };
    loadProfile();
  }, [t]);

  if (!formData) return <p>{t("loading")}</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t("select_image_file"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("image_size_limit"));
      return;
    }

    if (formData.previewUrl) {
      URL.revokeObjectURL(formData.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setFormData(prev => ({ ...prev, profileImageUrl: previewUrl, previewUrl }));
    toast.success(t("profile_image_selected"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = new FormData();
      const userFields = ["fullName","email","phone","bio","location","coordinates","region","district","ward","street"];
      userFields.forEach(key => {
        const value = formData[key];
        if (value !== undefined && value !== null) {
          dataToSend.append(key, typeof value === "object" ? JSON.stringify(value) : value);
        }
      });

      const ptFields = ["title","services","workExperience","education","institution","licenses","speciality","yearsOfExperience","workingHours","isPrivatePractice","languages","professionalMemberships","documents","licenseVerificationStatus","licenseVerificationNotes","availability","clinicIds"];
      const ptProfilePayload = {};
      ptFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null) {
          ptProfilePayload[field] = formData[field];
        }
      });

      const newFiles = [];
      const galleryPayload = (formData.gallery || []).map(item => {
        if (item.file) {
          newFiles.push({ file: item.file, caption: item.caption || "" });
          return null;
        } else if (item.imageUrl) {
          return { imageUrl: item.imageUrl, caption: item.caption || "" };
        }
        return null;
      }).filter(Boolean);

      ptProfilePayload.gallery = galleryPayload;
      dataToSend.append("ptProfile", JSON.stringify(ptProfilePayload));

      if (imageFile) dataToSend.append("avatar", imageFile);
      if (licenseFile) dataToSend.append("licenseDocument", licenseFile);

      newFiles.forEach(item => {
        dataToSend.append("galleryImages", item.file);
        dataToSend.append("galleryCaption", item.caption);
      });

      const updatedUser = await updateProfile(dataToSend);

      if (formData.previewUrl) URL.revokeObjectURL(formData.previewUrl);

      const timestamp = new Date().getTime();
      const newProfileImageUrl = updatedUser.profileImageUrl
        ? updatedUser.profileImageUrl.includes("?")
          ? `${updatedUser.profileImageUrl}&t=${timestamp}`
          : `${updatedUser.profileImageUrl}?t=${timestamp}`
        : null;

      const updatedUserData = { ...user, ...updatedUser, profileImageUrl: newProfileImageUrl };
      setUser(updatedUserData);
      localStorage.setItem("user", JSON.stringify(updatedUserData));

      // Reload the complete profile data to get the updated ptProfile including clinicIds
      const profileData = await getProfile();
      setFormData(prev => ({ 
        ...prev, 
        ...updatedUser, 
        profileImageUrl: newProfileImageUrl, 
        previewUrl: null,
        clinicIds: profileData.ptProfile?.clinicIds || []
      }));

      setImageFile(null);
      toast.success(t("profile_updated"));
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error(err.response?.data?.error || t("profile_update_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-white mt-16">
      <ProfileHeader 
        formData={formData} 
        handleChange={handleChange} 
        handleImageChange={handleImageChange} 
        location={formData.location}
        t={t}
      />

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="col-span-1 md:col-span-2">
            <LocationSelector
              initialLocation={formData.location}
              onLocationSelect={(location) => setFormData(prev => ({ ...prev, location }))}
              t={t}
            />
          </div>
          <OverviewSection formData={formData} handleChange={handleChange} t={t} />
          <Services formData={formData} setFormData={setFormData} t={t} />
          <Experience formData={formData} setFormData={setFormData} t={t} />
          <Education formData={formData} setFormData={setFormData} t={t} />
          <WorkingHours formData={formData} setFormData={setFormData} t={t} />
          <LicenseInfo formData={formData} setFormData={setFormData} setLicenseFile={setLicenseFile} user={user} t={t} />
          <ClinicManagement formData={formData} setFormData={setFormData} user={user} t={t} />
          <GallerySection formData={formData} setFormData={setFormData} t={t} />
        </div>

        <div className="space-y-6">
          <AvailabilitySection formData={formData} handleChange={handleChange} t={t} />
          <PasswordChangeSection t={t} />
        </div>
        <DefaultLanguageSection t={t} />
        <SaveButton loading={loading} t={t} />
      </form>
    </div>
  );
};

export default PTProfileSettings;
