import React, { useState } from "react";
import { Link } from "react-router";
import {
  Home,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import {
  MemberDetails,
  MemberAppointments,
  MemberSavedPTs,
} from "../../components/profiles";

import avatar from "../../assets/avatar.jpg";

const MemberDashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mt-20">
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

            <p className="mt-2 text-sm text-gray-500">
              Dar es Salaam, Tanzania
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/settings/member/:id"
                className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]"
              >
                Edit Profile
              </Link>
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

        {/* Right Sidebar (optional) */}
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

      {/* Collapsible Bottom Navigation */}
      <div className="fixed bottom-4 right-4 md:right-8 z-40">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="btn bg-caribbean text-white rounded-full shadow-md"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-16 right-0 bg-white shadow-lg rounded-2xl p-4 w-56 flex flex-col gap-3">
            <MemberNavLink to="/" icon={<Home size={18} />} label="Home" />
            <MemberNavLink
              to="/appointments/:id"
              icon={<Calendar size={18} />}
              label="Appointments"
            />
            <MemberNavLink
              to="/forum"
              icon={<MessageSquare size={18} />}
              label="Forum"
            />
            <MemberNavLink
              to="/settings/member/:id"
              icon={<Settings size={18} />}
              label="Settings"
            />
            <MemberNavLink to="/logout" icon={<LogOut size={18} />} label="Logout" />
          </div>
        )}
      </div>
    </div>
  );
};

function MemberNavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 text-black hover:text-caribbean hover:bg-alice px-3 py-2 rounded-lg transition-colors"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default MemberDashboard;
