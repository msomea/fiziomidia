import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/profile";
import avatar from "../../assets/avatar.jpg";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const previewUrl = URL.createObjectURL(file);
  setImageFile(file);
  setFormData((prev) => ({ ...prev, profileImageUrl: previewUrl }));
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
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "confirmPassword") dataToSend.append(key, value);
      });

      if (imageFile) dataToSend.append("avatar", imageFile);

      const updatedUser = await updateProfile(dataToSend);
      
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully!");
      setFormData((prev) => ({
  ...prev,
  profileImageUrl: updatedUser.profileImageUrl,
}));
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
          <div className="flex items-center gap-4">

            {/* <img
              src={formData.profileImageUrl || user.profileImageUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border"
            /> */}

            <img
              src={
                formData.profileImageUrl
                  ? formData.profileImageUrl.startsWith("http")
                    ? formData.profileImageUrl
                    : `http://localhost:4000${formData.profileImageUrl}`
                  : user?.profileImageUrl
                  ? user.profileImageUrl.startsWith("http")
                    ? user.profileImageUrl
                    : `http://localhost:4000${user.profileImageUrl}`
                  : avatar
              }
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border"
            />

            <input type="file" accept="image/*" onChange={handleImageChange} />
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
            <InputField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
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
