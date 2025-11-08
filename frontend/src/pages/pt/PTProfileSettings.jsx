import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../api/profile";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import {
  PTOverview,
  PTEducation,
  PTReviews,
  PTAvailability,
  PTGallery,
} from "../../components/profiles";
import Services from "../../components/ptsetting/Services";
import Experience from "../../components/ptsetting/Experience";
import avatar from "../../assets/avatar.jpg";

const PTProfileSettings = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    title: "",
    services: [],
    experience: "",
    education: "",
    gallery: [],
    availability: "",
    institution: "",
    licenseNumber: "",
    licenseImageUrl: "",
    licenseVerificationStatus: "",
    licenseVerificationNotes: "",
    speciality: [],
    yearsOfExperience: "",
    isPrivatePractice: true,
    profileImageUrl: ""
  });
  
  const [licenseFile, setLicenseFile] = useState(null);
  const [workingDay, setWorkingDay] = useState('Monday');
  const [workingFrom, setWorkingFrom] = useState('09:00');
  const [workingTo, setWorkingTo] = useState('17:00');

  // Load initial data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getProfile();
        setFormData({
          fullName: profileData.fullName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          location: profileData.location || "",
          bio: profileData.bio || "",
          title: profileData.ptProfile?.title || "",
          services: profileData.ptProfile?.services || [],
          experience: profileData.ptProfile?.experience || "",
          education: profileData.ptProfile?.education || "",
          gallery: profileData.ptProfile?.gallery || [],
          availability: profileData.ptProfile?.availability || "",
          institution: profileData.ptProfile?.institution || "",
          licenseNumber: profileData.ptProfile?.licenseNumber || "",
          speciality: profileData.ptProfile?.speciality || [],
          yearsOfExperience: profileData.ptProfile?.yearsOfExperience || "",
          isPrivatePractice: profileData.ptProfile?.isPrivatePractice ?? true,
          workingHours: profileData.ptProfile?.workingHours || [],
          profileImageUrl: profileData.profileImageUrl || ""
        });
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error("Failed to load profile data");
      }
    };

    loadProfile();
  }, []);

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

  const handleAddWorkingHour = () => {
    const entry = { dayOfWeek: workingDay, from: workingFrom, to: workingTo, isAvailable: true };
    setFormData(prev => ({
      ...prev,
      workingHours: [...(prev.workingHours || []), entry]
    }));
    toast.success('Working hour added');
  };

  const handleRemoveWorkingHour = (index) => {
    setFormData(prev => {
      const arr = [...(prev.workingHours || [])];
      arr.splice(index, 1);
      return { ...prev, workingHours: arr };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare form data for submission
      const dataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'previewUrl') {
          if (Array.isArray(value)) {
            dataToSend.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            dataToSend.append(key, value.toString());
          } else {
            dataToSend.append(key, value);
          }
        }
      });

      // Add profile image if changed
      if (imageFile) {
        dataToSend.append('avatar', imageFile);
      }

      // Add license file if changed
      if (licenseFile) {
        dataToSend.append('licenseDocument', licenseFile);
      }

      // Add PT specific fields
      dataToSend.append('ptProfile', JSON.stringify({
        title: formData.title,
        services: formData.services,
        experience: formData.experience,
        education: formData.education,
        gallery: formData.gallery,
        availability: formData.availability,
        institution: formData.institution,
        licenseNumber: formData.licenseNumber,
        speciality: formData.speciality,
        yearsOfExperience: formData.yearsOfExperience,
        workingHours: formData.workingHours || [],
        isPrivatePractice: formData.isPrivatePractice,
        licenseVerificationStatus: formData.licenseVerificationStatus,
        licenseVerificationNotes: formData.licenseVerificationNotes
      }));

      const updatedUser = await updateProfile(dataToSend);

      // Clean up preview URL
      if (formData.previewUrl) {
        URL.revokeObjectURL(formData.previewUrl);
      }

      // Update auth context and localStorage
      const timestamp = new Date().getTime();
      const newProfileImageUrl = updatedUser.profileImageUrl
        ? updatedUser.profileImageUrl.includes('?')
          ? `${updatedUser.profileImageUrl}&t=${timestamp}`
          : `${updatedUser.profileImageUrl}?t=${timestamp}`
        : null;

      const updatedUserData = {
        ...user,
        ...updatedUser,
        profileImageUrl: newProfileImageUrl
      };

      setUser(updatedUserData);
      localStorage.setItem('user', JSON.stringify(updatedUserData));

      // Reset states
      setImageFile(null);
      setFormData(prev => ({
        ...prev,
        ...updatedUser,
        previewUrl: null,
        profileImageUrl: newProfileImageUrl
      }));

      toast.success('Profile updated successfully!');
      
      // Notify other components
      window.dispatchEvent(new Event('profileUpdated'));
      
    } catch (err) {
      console.error('Profile update failed:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-white mt-20">
      {/* Header Section */}
      <div className="relative bg-white shadow-md rounded-b-3xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6">
          {/* Profile Image */}
          <div className="relative group">
            <img
              src={
                formData.previewUrl
                  ? formData.previewUrl
                  : formData.profileImageUrl
                  ? formData.profileImageUrl.startsWith("http")
                    ? formData.profileImageUrl
                    : `${API_URL}${formData.profileImageUrl}`
                  : avatar
              }
              alt="Physiotherapist"
              className="w-32 h-32 rounded-full object-cover border-4 border-gold transition-transform duration-300 group-hover:opacity-75"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = avatar;
              }}
            />
            <label className="absolute bottom-0 right-0 bg-caribbean text-white rounded-full p-2 cursor-pointer hover:bg-[#03bb74] transition-colors">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
              <span className="text-xs">Edit</span>
            </label>
          </div>

          {/* Editable Info */}
          <div className="flex-1 text-black">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="input input-bordered w-full font-bold text-2xl mb-2"
            />
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Professional Title"
              className="input input-bordered w-full text-sm mb-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                name="yearsOfExperience"
                value={formData.yearsOfExperience || ''}
                onChange={handleChange}
                placeholder="Years of Experience (e.g. 5 or 5-7)"
                className="input input-bordered w-full text-sm"
              />
              <input
                type="text"
                name="speciality"
                value={(formData.speciality || []).join(', ')}
                onChange={(e) => setFormData(prev => ({ ...prev, speciality: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                placeholder="Speciality (comma separated)"
                className="input input-bordered w-full text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="input input-bordered w-full text-sm"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="input input-bordered w-full text-sm"
              />
            </div>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              className="input input-bordered w-full text-sm mt-2"
            />
          </div>
        </div>
      </div>

      {/* Profile Editing Sections */}
      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Overview</h2>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="textarea textarea-bordered w-full h-32"
            ></textarea>
          </div>

          {/* Services */}
          <Services formData={formData} setFormData={setFormData} />

          {/* Experience */}
          <Experience formData={formData} setFormData={setFormData} />

          {/* Professional Title */}
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Professional Title</h2>
            <input
              type="text"
              name="title"
              value={formData.title || ""}
              onChange={handleChange}
              placeholder="e.g., Senior Physiotherapist, Sports Rehabilitation Specialist"
              className="input input-bordered w-full mb-2"
            />
            <p className="text-sm text-gray-500">
              This title will be displayed on your public profile
            </p>
          </div>

          {/* License Information */}
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">License Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber || ""}
                  onChange={handleChange}
                  placeholder="Enter your license number"
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleLicenseFileChange}
                  className="file-input file-input-bordered w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload your license document (PDF or image format)
                </p>
              </div>

              {formData.licenseVerificationStatus && (
                <div className={`mt-4 p-3 rounded-lg ${
                  formData.licenseVerificationStatus === 'approved' 
                    ? 'bg-green-50 text-green-700'
                    : formData.licenseVerificationStatus === 'rejected'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  <p className="font-medium">
                    Verification Status: {formData.licenseVerificationStatus.charAt(0).toUpperCase() + formData.licenseVerificationStatus.slice(1)}
                  </p>
                  {formData.licenseVerificationNotes && (
                    <p className="text-sm mt-1">{formData.licenseVerificationNotes}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Education</h2>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="textarea textarea-bordered w-full h-24"
            ></textarea>
          </div>

          {/* Working Hours */}
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Working Hours</h2>
            <div className="flex gap-2 items-center">
              <select
                value={workingDay}
                onChange={(e) => setWorkingDay(e.target.value)}
                className="select select-bordered"
              >
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
              <input type="time" value={workingFrom} onChange={(e)=>setWorkingFrom(e.target.value)} className="input input-bordered" />
              <input type="time" value={workingTo} onChange={(e)=>setWorkingTo(e.target.value)} className="input input-bordered" />
              <button type="button" onClick={handleAddWorkingHour} className="btn btn-sm bg-caribbean text-white">Add</button>
            </div>

            <ul className="mt-4 space-y-2 text-black">
              {(formData.workingHours || []).map((wh, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div>{wh.dayOfWeek} — {wh.from} to {wh.to}</div>
                  <div>
                    <button type="button" onClick={()=>handleRemoveWorkingHour(idx)} className="text-red-600">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Gallery */}
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Gallery</h2>
            <input
              type="file"
              multiple
              className="file-input file-input-bordered w-full"
            />
          </div>
        </div>

        {/* Right Column (Availability) */}
        <div className="space-y-6">
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Availability</h2>
            <textarea
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="textarea textarea-bordered w-full h-24"
            ></textarea>
          </div>

          <div className="card bg-white shadow-md p-6">
            <button
              type="submit"
              disabled={loading}
              className={`btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⌛</span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PTProfileSettings;
