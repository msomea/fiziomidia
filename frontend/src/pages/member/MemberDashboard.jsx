import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MemberDashboardProvider, useMemberDashboard } from "../../contexts/MemberDashboardContext";
import {
  Home,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useTranslation } from 'react-i18next'

import {
  MemberDetails,
  MemberAppointments,
  MemberSavedPTs,
} from "../../components/profiles";
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
    stats, 
    loading, 
    error, 
    fetchMemberDashboardData,
    markNotificationRead 
  } = useMemberDashboard();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Use authUser or guest as initial state
  const memberData = memberProfile || authUser || DEFAULT_USER;

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
            <MemberAppointments appointments={appointments} />
            <MemberSavedPTs savedPTs={savedPTs} />
            <ClinicPromotionStatus />
          </div>
        )}

        {/* Right Sidebar */}
        <div className="space-y-6">          
          <div className="bg-white shadow-sm rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-black mb-3 flex items-center justify-between">
              {t('notifications')}
              {notifications && notifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {notifications.length}
                </span>
              )}
            </h2>
            
            {notifications && notifications.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification._id}
                    className={`p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity ${
                      notification.type === 'clinic_request_accepted' 
                        ? 'border-green-500 bg-green-50' 
                        : notification.type === 'clinic_request_rejected'
                        ? 'border-red-500 bg-red-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                    onClick={() => markNotificationRead(memberData._id, notification._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'clinic_request_accepted' ? (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010-1.414l-8 8a1 1 0 00-1.414 1.414l8-8a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        ) : notification.type === 'clinic_request_rejected' ? (
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414-1.414l10 10a1 1 0 001.414 1.414l-10-10a1 1 0 01-1.414-1.414z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-3-8a3 3 0 00-3 3v6a3 3 0 003 3h6a3 3 0 003-3V5a3 3 0 00-3-3h-6z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 5 && (
                  <button
                    onClick={() => {/* TODO: Navigate to full notifications page */}}
                    className="w-full text-center text-sm text-caribbean hover:text-caribbean/80 py-2"
                  >
                    {t('view_all_notifications')}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v6a6 6 0 016 6v6a6 6 0 01-6 6v6a6 6 0 0016 6v-6a6 6 0 00-6-6z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 10v0"/>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">{t('no_notifications')}</p>
              </div>
            )}
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
