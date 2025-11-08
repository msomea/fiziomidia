import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
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

// ✅ Default guest user
const DEFAULT_USER = {
  _id: null,
  fullName: "Guest",
  profileImageUrl: avatar,
  role: "guest",
  createdAt: null,
  email: null,
};

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser, logout, setUser } = useAuth();

  // Use authUser or guest as initial state
  const [memberData, setMemberData] = useState(authUser || DEFAULT_USER);
  const [loading, setLoading] = useState(authUser?.role !== "guest");
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

  // Fetch full user data if logged in
  const fetchUserData = async () => {
    if (!authUser || authUser.role === "guest") {
      setLoading(false);
      return;
    }

    try {
      const response = await API.get("/users/profile");
      const fullUserData = response.data;

      // Add timestamp to force image refresh
      const timestamp = new Date().getTime();
      if (fullUserData.profileImageUrl) {
        fullUserData.profileImageUrl = fullUserData.profileImageUrl.includes("?")
          ? `${fullUserData.profileImageUrl}&t=${timestamp}`
          : `${fullUserData.profileImageUrl}?t=${timestamp}`;
      }

      setMemberData(fullUserData);
      const updatedUser = { ...authUser, ...fullUserData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Error fetching member data:", err);
      if (err.response?.status === 401) {
        logout(navigate);
      }
      toast.error(err.response?.data?.error || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserData();
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          Loading your profile...
        </p>
      </div>
    );
  }

  // Safe avatar rendering
  const profileImage = memberData.profileImageUrl
    ? memberData.profileImageUrl.startsWith("http")
      ? memberData.profileImageUrl
      : `${API_URL}${memberData.profileImageUrl}`
    : avatar;

  // Submit PT Upgrade Form
  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const upgradeData = {
        upgradeToPhysiotherapist: true,
        institution: formData.institution,
        isPrivatePractice: formData.isPrivatePractice,
        licenseNumber: formData.licenseNumber,
        speciality: formData.speciality.split(",").map((s) => s.trim()),
        yearsOfExperience: Number(formData.yearsOfExperience),
        bio: formData.bio,
      };

      const response = await API.put("/users/profile", upgradeData);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMemberData(updatedUser);

      toast.success("You are now a Physiotherapist!");
      setShowUpgradeForm(false);
      navigate(`/dashboard/pt/${memberData._id}`);
    } catch (err) {
      console.error("Upgrade failed:", err);
      toast.error(err.response?.data?.error || "Failed to upgrade to Physiotherapist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mt-20">
      {/* Header Section */}
      <div className="relative bg-white shadow-md rounded-b-3xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6">
          {/* Member Avatar */}
          <img
            src={profileImage}
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
              {memberData.fullName || "Guest"}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Member since{" "}
              {memberData.createdAt
                ? new Date(memberData.createdAt).toLocaleDateString()
                : "-"}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {memberData.role !== "guest" && (
                <>
                  <Link
                    to={`/settings/member/${memberData._id}`}
                    className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]"
                  >
                    Edit Profile
                  </Link>

                  {memberData.role === "member" && (
                    <button
                      onClick={() => setShowUpgradeForm(true)}
                      className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]"
                    >
                      Become a Physiotherapist
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => logout(navigate)}
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
        {memberData.role !== "guest" && (
          <div className="lg:col-span-2 space-y-6">
            <MemberDetails member={memberData} />
            <MemberAppointments memberId={memberData._id} />
            <MemberSavedPTs memberId={memberData._id} />
          </div>
        )}

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
            <MemberNavLink to="/forum" icon={<MessageSquare size={18} />} label="Forum" />
            <MemberNavLink
              to={`/settings/member/${memberData._id}`}
              icon={<Settings size={18} />}
              label="Settings"
            />
            <button
              onClick={() => logout(navigate)}
              className="flex items-center gap-3 text-black hover:text-caribbean hover:bg-alice px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Upgrade to PT Modal */}
      {showUpgradeForm && memberData.role === "member" && (
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
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-caribbean text-white rounded-lg hover:bg-[#03bb74] flex items-center gap-2 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin">⌛</span>
                      Processing...
                    </>
                  ) : (
                    "Submit"
                  )}
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
