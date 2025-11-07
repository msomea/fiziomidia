import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
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
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";



const MemberDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [formData, setFormData] = useState({
    institution: "",
    isPrivatePractice: true,
    licenseNumber: "",
    speciality: "",
    yearsOfExperience: "",
    bio: "",
  });

  // Fetch member data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        // Fetch complete profile data
        const response = await API.get("/users/profile");
        const fullUserData = response.data;
        
        // Update both local state and auth context
        setMemberData(fullUserData);
        
        // Update the stored user data with complete profile
        const updatedUser = { ...user, ...fullUserData };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
      } catch (err) {
        console.error("Error fetching member data:", err);
        if (err.response?.status === 401) {
          logout();
        }
        toast.error(err.response?.data?.error || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, logout, setUser]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-caribbean">
        Loading your profile...
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Unable to load profile. Please login again.
      </div>
    );
  }

  // Submit PT Upgrade Form
  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axios.put(
        "/api/users/profile",
        {
          upgradeToPhysiotherapist: true,
          institution: formData.institution,
          isPrivatePractice: formData.isPrivatePractice,
          licenseNumber: formData.licenseNumber,
          speciality: formData.speciality.split(",").map((s) => s.trim()),
          yearsOfExperience: Number(formData.yearsOfExperience),
          bio: formData.bio,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("You are now a Physiotherapist!");
      navigate(`/dashboard/pt/${memberData._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Upgrade failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mt-20">
      {/* Header Section */}
      <div className="relative bg-white shadow-md rounded-b-3xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6">
          {/* Member Avatar */}
          <img
            src={
              memberData.profileImageUrl
                ? memberData.profileImageUrl.startsWith("http")
                  ? memberData.profileImageUrl
                  : `${API_URL}${memberData.profileImageUrl}`
                : avatar
            }
            alt="Member Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-caribbean"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = avatar;
            }}
          />

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              {memberData.fullName}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Member since {new Date(memberData.createdAt).toLocaleDateString()}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/settings/member/${memberData._id}`}
                className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]"
              >
                Edit Profile
              </Link>

              {/* Show upgrade button only if member */}
              {memberData.role === "member" && (
                <button
                  onClick={() => setShowUpgradeForm(true)}
                  className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]"
                >
                  Become a Physiotherapist
                </button>
              )}

              <button
                onClick={logout}
                className="border border-caribbean text-caribbean px-4 py-2 rounded-lg hover:bg-caribbean hover:text-white"
              >
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
          <MemberDetails member={memberData} />
          <MemberAppointments memberId={memberData._id} />
          <MemberSavedPTs memberId={memberData._id} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-black mb-3">Reminders</h2>
            <p className="text-sm text-gray-600">
              Stay consistent with your exercises. Your next appointment is in 2 days!
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
              to={`/appointments/${memberData._id}`}
              icon={<Calendar size={18} />}
              label="Appointments"
            />
            <MemberNavLink
              to="/forum"
              icon={<MessageSquare size={18} />}
              label="Forum"
            />
            <MemberNavLink
              to={`/settings/member/${memberData._id}`}
              icon={<Settings size={18} />}
              label="Settings"
            />
            <button
              onClick={logout}
              className="flex items-center gap-3 text-black hover:text-caribbean hover:bg-alice px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Upgrade to PT Modal */}
      {showUpgradeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Upgrade to Physiotherapist
            </h2>
            <form onSubmit={handleUpgradeSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Institution"
                value={formData.institution}
                onChange={(e) =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                className="w-full border rounded-lg p-2"
                required
              />
              <input
                type="text"
                placeholder="License Number"
                value={formData.licenseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, licenseNumber: e.target.value })
                }
                className="w-full border rounded-lg p-2"
                required
              />
              <input
                type="text"
                placeholder="Speciality (comma separated)"
                value={formData.speciality}
                onChange={(e) =>
                  setFormData({ ...formData, speciality: e.target.value })
                }
                className="w-full border rounded-lg p-2"
                required
              />
              <input
                type="number"
                placeholder="Years of Experience"
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({ ...formData, yearsOfExperience: e.target.value })
                }
                className="w-full border rounded-lg p-2"
                required
              />
              <textarea
                placeholder="Short Bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />
              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setShowUpgradeForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-caribbean text-white rounded-lg hover:bg-[#03bb74]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
