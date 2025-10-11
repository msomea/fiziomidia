import React from "react";
import {
    PTOverview,
    PTServices,
    PTExperience,
    PTEducation,
    PTReviews,
    PTAvailability,
    PTGallery
} from "../components/profiles";
import avatar from "../assets/avatar.jpg";



const PTProfile = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mt-20">
      {/* Header Section */}
      <div className="relative bg-white shadow-md rounded-b-3xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6">
          {/* PT Image */}
          <img
            src={avatar}
            alt="Physiotherapist"
            className="w-32 h-32 rounded-full object-cover border-4 border-gold"
          />

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              Dr. Jane Mwita
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Senior Physiotherapist | 10+ Years Experience
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Dar es Salaam, Tanzania
            </p>

            {/* Contact / Book */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-tufts">
                Book Appointment
              </button>
              <button className="btn btn-outline border-caribbean text-caribbean px-4 py-2 rounded-lg hover:bg-caribbean hover:text-white">
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <PTOverview />
          <PTServices />
          <PTExperience />
          <PTEducation />
          <PTGallery />
          <PTReviews />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <PTAvailability />
        </div>
      </div>
    </div>
  );
};

export default PTProfile;
