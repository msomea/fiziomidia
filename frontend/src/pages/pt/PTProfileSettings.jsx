import React, { useState } from "react";
import {
  PTOverview,
  PTServices,
  PTExperience,
  PTEducation,
  PTReviews,
  PTAvailability,
  PTGallery,
} from "../../components/profiles";
import avatar from "../../assets/avatar.jpg";

const PTProfileSettings = () => {
  const [formData, setFormData] = useState({
    name: "Dr. Jane Mwita",
    title: "Senior Physiotherapist | 10+ Years Experience",
    location: "Dar es Salaam, Tanzania",
    bio: "Passionate about helping patients recover through personalized therapy programs.",
    services: ["Manual Therapy", "Exercise Prescription", "Sports Rehab"],
    experience: "10 years at Muhimbili Hospital, specialized in neuro and orthopedic rehab.",
    education: "BSc Physiotherapy, MUHAS (2012)",
    gallery: [],
    availability: "Mon - Fri, 9 AM - 5 PM",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated profile:", formData);
    // TODO: send data to backend
  };

  return (
    <div className="min-h-screen bg-gray-50 text-white mt-20">
      {/* Header Section */}
      <div className="relative bg-white shadow-md rounded-b-3xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6">
          {/* Profile Image */}
          <div className="relative">
            <img
              src={avatar}
              alt="Physiotherapist"
              className="w-32 h-32 rounded-full object-cover border-4 border-gold"
            />
            <label className="absolute bottom-0 right-0 bg-caribbean text-white rounded-full p-2 cursor-pointer">
              <input type="file" className="hidden" />
              <span className="text-xs">Edit</span>
            </label>
          </div>

          {/* Editable Info */}
          <div className="flex-1">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input input-bordered w-full font-bold text-2xl mb-2"
            />
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input input-bordered w-full text-sm mb-2"
            />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input input-bordered w-full text-sm mb-2"
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
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Services</h2>
            <textarea
              name="services"
              value={formData.services.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  services: e.target.value.split(",").map((s) => s.trim()),
                })
              }
              className="textarea textarea-bordered w-full h-24"
            ></textarea>
          </div>

          {/* Experience */}
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-caribbean">Experience</h2>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="textarea textarea-bordered w-full h-24"
            ></textarea>
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
              className="btn bg-caribbean text-white w-full hover:bg-tufts"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PTProfileSettings;
