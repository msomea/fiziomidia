import React from "react";
import {
  MemberDetails,
  MemberAppointments,
  MemberSavedPTs,
} from "../components/profiles";
import avatar from "../assets/avatar.jpg";

const MemberProfile = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header Section */}
      <div className="relative bg-white shadow-md rounded-b-3xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6">
          {/* Member Avatar */}
          <img
            src={avatar}
            alt="Member Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-caribbean"
          />

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              Brian Kileo
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Member since January 2024
            </p>

            <p className="mt-2 text-sm text-gray-500">Dar es Salaam, Tanzania</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]">
                Edit Profile
              </button>
              <button className="border border-caribbean text-caribbean px-4 py-2 rounded-lg hover:bg-caribbean hover:text-white">
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <MemberDetails />
          <MemberAppointments />
          <MemberSavedPTs />
        </div>

        {/* Right Sidebar (optional for ads or reminders later) */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-black mb-3">Reminders</h2>
            <p className="text-sm text-gray-600">
              Stay consistent with your exercises. Your next appointment is in 2
              days!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
