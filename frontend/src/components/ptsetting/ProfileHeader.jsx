import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ASSET_URL} from "../../config/constants";
import avatar from "../../assets/avatar.jpg";

const ProfileHeader = ({ formData, handleChange, handleImageChange, location }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { region, district, ward, street } = location || {};
  const formattedLocation = [region, district, ward, street].filter(Boolean).join(" > ");

  return (
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
                  : `${ASSET_URL}${formData.profileImageUrl}`
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

        {/* Name always visible */}
        <div className="flex-1 text-black">
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            className="input input-bordered w-full font-bold text-2xl mb-2"
          />

          {/* Collapsible Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center mb-4"
          >
            <h2 className="text-xl font-bold text-caribbean">Profile Details</h2>
            <ChevronDown
              className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Collapsible Fields */}
          {isOpen && (
            <div className="space-y-3">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Professional Title"
                className="input input-bordered w-full text-sm"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience || ""}
                  onChange={handleChange}
                  placeholder="Years of Experience"
                  className="input input-bordered w-full text-sm"
                />
                <input
                  type="text"
                  name="speciality"
                  value={(formData.speciality || []).join(", ")}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "speciality",
                        value: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    })
                  }
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

              {/* Location */}
              <p className="text-sm text-gray-700">
                Location: {formattedLocation || "Not set"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
