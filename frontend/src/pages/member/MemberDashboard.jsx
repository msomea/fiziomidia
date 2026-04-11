import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { MemberDashboardProvider, useMemberDashboard } from "../../contexts/MemberDashboardContext";
import {
  Home,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from 'react-i18next'

import {
  MemberDetails,
  MemberAppointments,
  MemberSavedPTs,
} from "../../components/profiles";
import MemberClinicAppointments from "../../components/dashboard/member/MemberClinicAppointments";
import NotificationSection from "../../components/dashboard/NotificationSection";
import ClinicPromotionStatus from "../../components/dashboard/ClinicPromotionStatus";

import avatar from "../../assets/avatar.jpg";
import toast from "react-hot-toast";

// Default guest user
const DEFAULT_USER = {
  _id: null,
  fullName: "Guest",
  profileImageUrl: avatar,
  role: "guest",
  createdAt: null,
  email: null,
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

function MemberDashboardContent() {
  const navigate = useNavigate();
  const { user: authUser, logout, setUser } = useAuth();
  const { t } = useTranslation()
  const { 
    memberProfile, 
    appointments, 
    savedPTs, 
    notifications,
    clinicAppointments,
    clinics,
    clinicPromotions,
    stats, 
    loading, 
    error, 
    fetchMemberDashboardData,
    refreshDashboard,
    markNotificationRead 
  } = useMemberDashboard();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use authUser or guest as initial state
  const memberData = memberProfile || authUser || DEFAULT_USER;

  // Handle refresh with cache invalidation
  const handleRefreshDashboard = async () => {
    if (!authUser || authUser.role === "guest") {
      return;
    }

    try {
      setIsRefreshing(true);
      
      // Force refresh all dashboard data with cache bypass
      await refreshDashboard(true);
      
      toast.success(t('dashboard_refreshed'));
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      toast.error(t('dashboard_refresh_failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authUser || authUser.role === "guest") {
      return;
    }

    // Fetch all dashboard data at once
    fetchMemberDashboardData();
  }, [authUser, fetchMemberDashboardData]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (authUser && authUser.role !== "guest") {
        fetchMemberDashboardData();
      }
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, [authUser, fetchMemberDashboardData]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t('loading_your_profile')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        <div className="text-center">
          <p className="mb-4">{t('dashboard_load_error')}</p>
          <button 
            onClick={() => fetchMemberDashboardData()}
            className="btn btn-primary"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  // Safe avatar rendering
  const profileImage = memberData.profileImageUrl
    ? memberData.profileImageUrl.startsWith("http")
      ? memberData.profileImageUrl
      : memberData.profileImageUrl
    : avatar;

    
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mt-14">
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
              {memberData.fullName || t('guest_label')}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {t('member_since')} {memberData.createdAt ? new Date(memberData.createdAt).toLocaleDateString() : "-"}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {memberData.role !== "guest" && (
                <>
                  <button
                    onClick={handleRefreshDashboard}
                    disabled={isRefreshing}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? t('refreshing') : t('refresh_dashboard')}
                  </button>

                  <Link
                    to={`/settings/member/${memberData._id}`}
                    className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]"
                  >
                    {t('edit_profile')}
                  </Link>

                  {memberData.role === "member" && (
                    <Link
                      to="/upgrade-to-pt"
                      className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-[#03bb74]"
                    >
                       {t('become_physio')}
                    </Link>
                  )}
                </>
              )}

              <button
                onClick={() => logout(navigate)}
                className="border border-caribbean text-caribbean px-4 py-2 rounded-lg hover:bg-caribbean hover:text-white"
              >
                 {t('log_out')}
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
            <MemberAppointments appointments={appointments} userId={memberData._id} />
            <MemberSavedPTs savedPTs={savedPTs} />
            {clinics && clinics.length > 0 && (
              <ClinicPromotionStatus clinics={clinics} clinicPromotions={clinicPromotions} />
            )}
            {clinics && clinics.length > 0 && (
              <MemberClinicAppointments 
                appointments={clinicAppointments}
                viewMore={`/member/clinic-appointments`}
              />
            )}
          </div>
        )}

        {/* Right Sidebar */}
        <div className="space-y-6">          
          <NotificationSection 
            notifications={notifications}
            markNotificationRead={markNotificationRead}
            userId={memberData._id}
          />
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
            <MemberNavLink to="/" icon={<Home size={18} />} label={t('home')} />
            <MemberNavLink
              to={`/appointments/member/${memberData._id}`}
              icon={<Calendar size={18} />}
              label={t('appointments')}
            />
            <MemberNavLink to="/forum" icon={<MessageSquare size={18} />} label={t('forum')} />
            <MemberNavLink
              to={`/settings/member/${memberData._id}`}
              icon={<Settings size={18} />}
              label={t('admin_settings')}
            />
            <button
              onClick={() => logout(navigate)}
              className="flex items-center gap-3 text-black hover:text-caribbean hover:bg-alice px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>{t('log_out')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  return (
    <MemberDashboardProvider>
      <MemberDashboardContent />
    </MemberDashboardProvider>
  );
}
