import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../api/profile";
import toast from "react-hot-toast";

import ProfileHeader from "../../components/ptsetting/ProfileHeader";
import OverviewSection from "../../components/ptsetting/OverviewSection";
import LicenseInfo from "../../components/ptsetting/LicenseInfo";
import Services from "../../components/ptsetting/Services";
import Experience from "../../components/ptsetting/Experience";
import Education from "../../components/ptsetting/Education";
import WorkingHours from "../../components/ptsetting/WorkingHours";
import AvailabilitySection from "../../components/ptsetting/AvailabilitySection";
import GallerySection from "../../components/ptsetting/GallerySection";
import SaveButton from "../../components/ptsetting/SaveButton";
import LocationSelector from "../../components/ptsetting/LocationSelector";

const PTProfileSettings = () => {
  const navigate = useNavigate();
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

  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getProfile();
        setFormData({
          // USER fields
          fullName: profileData.fullName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          profileImageUrl: profileData.profileImageUrl || "",
          bio: profileData.bio || "",
          location: profileData.location || [],

          // FLATTENED location
          coordinates: profileData.location?.coordinates || [0, 0],
          region: profileData.location?.region || "",
          district: profileData.location?.district || "",
          ward: profileData.location?.ward || "",
          street: profileData.location?.street || "",

          // FLATTENED PT profile fields
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
          
          // availability
          isAcceptingNewPatients:
            profileData.ptProfile?.availability?.isAcceptingNewPatients ?? true,
          nextAvailableDate:
            profileData.ptProfile?.availability?.nextAvailableDate || null,

          licenses: profileData.ptProfile?.licenses || [],
          professionalMemberships: profileData.ptProfile?.professionalMemberships || [],
          documents: profileData.ptProfile?.documents || [],
        });

      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error("Failed to load profile data");
      }
    };
    loadProfile();
  }, []);

  if (!formData) return <p>Loading...</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview URL
    if (formData.previewUrl) {
      URL.revokeObjectURL(formData.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    
    setImageFile(file);
    setFormData(prev => ({
      ...prev,
      profileImageUrl: previewUrl,
      previewUrl: previewUrl
    }));
    toast.success('Profile image selected');
  };

  const handleLicenseFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a PDF or image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setLicenseFile(file);
    toast.success('License document selected');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const dataToSend = new FormData();

    // -------------------
    // Top-level user fields
    // -------------------
    const userFields = [
      "fullName",
      "email",
      "phone",
      "bio",
      "profileImageUrl",
      "location",
      "coordinates",
      "region",
      "district",
      "ward",
      "street",
    ];

    userFields.forEach((key) => {
      const value = formData[key];
      if (value !== undefined && value !== null) {
        if (typeof value === "object") {
          dataToSend.append(key, JSON.stringify(value));
        } else {
          dataToSend.append(key, value);
        }
      }
    });

    // -------------------
    // PT profile fields
    // -------------------
    const ptFields = [
      "title",
      "services",
      "workExperience",
      "education",
      "gallery",
      "availability",
      "institution",
      "licenses",
      "speciality",
      "yearsOfExperience",
      "workingHours",
      "isPrivatePractice",
      "languages",
      "professionalMemberships",
      "documents",
      "licenseVerificationStatus",
      "licenseVerificationNotes",
    ];

    const ptProfilePayload = {};

    ptFields.forEach((field) => {
      const value = formData[field];
      if (value !== undefined) {
        ptProfilePayload[field] = value; // keep as object/array
      }
    });

    // Append PT profile as one object
    dataToSend.append("ptProfile", JSON.stringify(ptProfilePayload));

    // -------------------
    // Files
    // -------------------
    if (imageFile) dataToSend.append("avatar", imageFile);
    if (licenseFile) dataToSend.append("licenseDocument", licenseFile);

    // -------------------
    // Send request
    // -------------------
    const updatedUser = await updateProfile(dataToSend);

    // -------------------
    // Update context and local storage
    // -------------------
    if (formData.previewUrl) URL.revokeObjectURL(formData.previewUrl);

    const timestamp = new Date().getTime();
    const newProfileImageUrl = updatedUser.profileImageUrl
      ? updatedUser.profileImageUrl.includes("?")
        ? `${updatedUser.profileImageUrl}&t=${timestamp}`
        : `${updatedUser.profileImageUrl}?t=${timestamp}`
      : null;

    const updatedUserData = {
      ...user,
      ...updatedUser,
      profileImageUrl: newProfileImageUrl,
    };

    setUser(updatedUserData);
    localStorage.setItem("user", JSON.stringify(updatedUserData));

    // Reset states
    setImageFile(null);
    setFormData((prev) => ({
      ...prev,
      ...updatedUser,
      profileImageUrl: newProfileImageUrl,
      previewUrl: null,
    }));

    toast.success("Profile updated successfully!");
    window.dispatchEvent(new Event("profileUpdated"));
  } catch (err) {
    console.error("Profile update failed:", err);
    toast.error(err.response?.data?.error || "Failed to update profile");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50 text-white mt-20">
      <ProfileHeader 
        formData={formData} 
        handleChange={handleChange} 
        handleImageChange={handleImageChange} 
        location={formData.location}
      />

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location Selector */}
          <div className="col-span-1 md:col-span-2">
            <LocationSelector
              initialLocation={formData.location}
              onLocationSelect={(location) => 
                setFormData((prev) => ({...prev, location}))
              }
              
            />
          </div>
          <OverviewSection formData={formData} handleChange={handleChange} />
          <Services formData={formData} setFormData={setFormData} />
          <Experience formData={formData} setFormData={setFormData} />
          <Education formData={formData} setFormData={setFormData} />
          <WorkingHours formData={formData} setFormData={setFormData} />
          <LicenseInfo 
            formData={formData} 
            handleChange={handleChange} 
            handleLicenseFileChange={handleLicenseFileChange} 
          />
          <GallerySection formData={formData} setFormData={setFormData} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AvailabilitySection formData={formData} handleChange={handleChange} />
          <SaveButton loading={loading} />
        </div>
      </form>
    </div>
  );
};

export default PTProfileSettings;
