import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, getProfile } from "../../api/profile";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import LocationSelector from "../../components/dashboard/member/LocationSelector";

export default function MemberProfileSettings() {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    password: "",
    confirmPassword: "",
    profileImageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        profileImageUrl: user.profileImageUrl || "",
      }));
    }
  }, [user]);

  //location selector handler
  const [form, setForm] = useState({
    name: "",
    location: {},
  });

  const handleLocationSelect = (location) => {
    setForm(prev => ({ ...prev, location }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Create a new preview URL and revoke the old one if it exists
    if (formData.previewUrl) {
      URL.revokeObjectURL(formData.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    
    setImageFile(file);
    setFormData(prev => ({
      ...prev,
      profileImageUrl: previewUrl,
      previewUrl: previewUrl // Store the preview URL to clean up later
    }));
    toast.success('Image selected successfully');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const dataToSend = new FormData();
      
      // Only append non-empty values
      Object.entries(formData).forEach(([key, value]) => {
        if (value && 
            key !== "confirmPassword" && 
            key !== "profileImageUrl" && 
            key !== "previewUrl") {
          dataToSend.append(key, value);
        }
      });

      if (imageFile) {
        dataToSend.append("avatar", imageFile);
      }

      const updatedUser = await updateProfile(dataToSend);

      // Clean up the preview URL
      if (formData.previewUrl) {
        URL.revokeObjectURL(formData.previewUrl);
      }

      // Add timestamp to force image refresh
      const timestamp = new Date().getTime();
      const newProfileImageUrl = updatedUser.profileImageUrl
        ? updatedUser.profileImageUrl.includes('?')
          ? `${updatedUser.profileImageUrl}&t=${timestamp}`
          : `${updatedUser.profileImageUrl}?t=${timestamp}`
        : null;

      // Create the complete updated user data
      const updatedUserData = {
        ...user,
        ...updatedUser,
        profileImageUrl: newProfileImageUrl
      };
      
      // Update auth context
      setUser(updatedUserData);

      // Update localStorage with the same data
      localStorage.setItem("user", JSON.stringify(updatedUserData));

      // Fetch fresh profile data to ensure everything is in sync
      const freshProfileData = await getProfile();
      
      // Update form data with fresh values
      setFormData(prev => ({
        ...prev,
        ...freshProfileData,
        password: "",
        confirmPassword: "",
        previewUrl: null,
        profileImageUrl: newProfileImageUrl
      }));

      // Reset the image file state
      setImageFile(null);
      
      toast.success("Profile updated successfully!");

      // Force a re-render of other components that might be showing the profile image
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error(err.response?.data?.error || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alice mt-20 flex justify-center items-center px-4 py-8">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg p-6 md:p-10">
        <h2 className="text-2xl font-semibold text-tufts mb-6 text-center">
          Update Profile Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <img
                src={
                  formData.previewUrl // First check for preview URL
                    ? formData.previewUrl
                    : formData.profileImageUrl // Then check for profile image URL
                    ? formData.profileImageUrl.startsWith("http")
                      ? formData.profileImageUrl
                      : `${API_URL}${formData.profileImageUrl}`
                    : user?.profileImageUrl // Finally fall back to user profile image
                    ? user.profileImageUrl.startsWith("http")
                      ? user.profileImageUrl
                      : `${API_URL}${user.profileImageUrl}`
                    : avatar // Default avatar as last resort
                }
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-caribbean shadow-lg transition-transform duration-300 group-hover:opacity-75"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = avatar;
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <label htmlFor="avatar-upload" className="cursor-pointer bg-caribbean text-white px-3 py-2 rounded-lg hover:bg-[#03bb74] transition-colors">
                  Change Photo
                </label>
              </div>
            </div>
            
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            
            {imageFile && (
              <div className="text-sm text-gray-600">
                Selected: {imageFile.name}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <LocationSelector onLocationSelect={(handleLocationSelect)}
            />
          </div>

          <div>
            <label className="font-semibold text-black">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="textarea textarea-bordered w-full mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="New Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className={`btn bg-caribbean hover:bg-tufts text-white w-full font-semibold ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, name, type = "text", value, onChange }) {
  return (
    <div className="form-control">
      <label className="font-semibold text-black">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="input input-bordered w-full mt-1"
      />
    </div>
  );
}
