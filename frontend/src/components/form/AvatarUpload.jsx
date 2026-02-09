import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import avatar from "../../assets/avatar.jpg";

export default function AvatarUpload({ profileImageUrl, selectedFile, setImageFile, onChange }) {
  const [previewUrl, setPreviewUrl] = useState(profileImageUrl);

  // Load current avatar from backend
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(profileImageUrl);
    }
  }, [selectedFile, profileImageUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Revoke only blob URLs (ObjectURL)
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreview = URL.createObjectURL(file);
    setPreviewUrl(newPreview);

    setImageFile(file);
    if (onChange) onChange(file);

    toast.success("Image selected successfully");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <img
          src={previewUrl || avatar}
          alt="Avatar"
          className="w-32 h-32 rounded-full object-cover border-4 border-caribbean shadow-lg transition-transform duration-300 group-hover:opacity-75"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = avatar;
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer bg-caribbean text-white px-3 py-2 rounded-lg hover:bg-[#03bb74] transition-colors"
          >
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
    </div>
  );
}
