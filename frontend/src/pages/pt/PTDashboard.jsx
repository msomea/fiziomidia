import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { PTDashboardProvider, usePTDashboard } from "../../contexts/PTDashboardContext";
import Statistics from "../../components/dashboard/pt/Statistics";
import UpcomingAppointments from "../../components/dashboard/pt/UpcomingAppointments";
import ForumSubManagement from "../../components/dashboard/pt/ForumSubManagement";
import ClinicPromotionStatus from "../../components/dashboard/ClinicPromotionStatus";
import PromotionStatus from "../../components/dashboard/pt/PromotionStatus";
import ClinicInvitations from "../../components/dashboard/pt/ClinicInvitations";

import {
  Menu,
  X,
  Home,
  Calendar,
  Users,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
  LoaderIcon,
} from "lucide-react";

import { useTranslation } from "react-i18next";

function PTDashboardContent() {
  const { t } = useTranslation();
  const { _id } = useParams(); // PT ID
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    ptProfile, 
    clinics,
    appointments, 
    forumPosts, 
    promotion, 
    notifications,
    stats, 
    loading, 
    error, 
    fetchPTDashboardData,
    markNotificationRead 
  } = usePTDashboard();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!user || !_id || user._id === null) return;

    // Fetch all dashboard data at once
    fetchPTDashboardData(_id);
  }, [user, _id, fetchPTDashboardData]);

  // Listen for clinic updates from settings
  useEffect(() => {
    const handleClinicsUpdated = () => {
      if (user && _id) {
        fetchPTDashboardData(_id);
      }
    };
    
    window.addEventListener("clinicsUpdated", handleClinicsUpdated);
    
    return () => {
      window.removeEventListener("clinicsUpdated", handleClinicsUpdated);
    };
  }, [user, _id, fetchPTDashboardData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-caribbean">
        <LoaderIcon className="animate-spin size-10" />
        {t("loading_dashboard")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        <div className="text-center">
          <p className="mb-4">{t("dashboard_load_error")}</p>
          <button 
            onClick={() => fetchPTDashboardData(_id)}
            className="btn btn-primary"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!ptProfile) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {t("pt_profile_load_error")}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-alice mt-10 text-black p-4 md:p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <h1 className="text-2xl font-bold">
            {ptProfile.fullName} {t("dashboard_title")}
          </h1>

          {/* Statistics Widget */}
          <Statistics stats={stats} />

          {/* Upcoming Appointments */}
          <UpcomingAppointments
            appointments={appointments}
            viewMore={`/pt/${user._id}/appointments`}
          />

          {/* Clinic Promotions */}
          <ClinicPromotionStatus />

          {/* Clinic Invitations */}
          <ClinicInvitations t={t} />

          {/* Forum & PT Promotion */}
          <div className="grid md:grid-cols-2 gap-4">
            <ForumSubManagement />
            <PromotionStatus
              promotion={promotion}
              extendLink={`/promotions/pt/${_id}`}
              addLink={`/promotions/pt/${_id}/add`}
            />
          </div>
        </div>

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
                      notification.type === 'clinic_invitation' 
                        ? 'border-blue-500 bg-blue-50' 
                        : notification.type === 'clinic_invitation_cancelled'
                        ? 'border-red-500 bg-red-50'
                        : 'border-green-500 bg-green-50'
                    }`}
                    onClick={() => markNotificationRead(user._id, notification._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'clinic_invitation' ? (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        ) : notification.type === 'clinic_invitation_cancelled' ? (
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414-1.414l10 10a1 1 0 001.414 1.414l-10-10a1 1 0 01-1.414-1.414z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010-1.414l-8 8a1 1 0 00-1.414 1.414l8-8a1 1 0 001.414-1.414z" clipRule="evenodd"/>
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
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="btn bg-caribbean text-white rounded-full shadow-md"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-16 right-0 bg-white shadow-lg rounded-2xl p-4 w-56 flex flex-col gap-3">
            <PTNavLink to="/" icon={<Home size={18} />} label={t("home")} />
            <PTNavLink to={`/pt/${user._id}/appointments`} icon={<Calendar size={18} />} label={t("appointments")} />
            <PTNavLink to="/messages/users" icon={<Users size={18} />} label={t("patients")} />
            <PTNavLink to={`/forum`} icon={<MessageSquare size={18} />} label={t("forum")} />
            <PTNavLink to={"/services/promotions/create"} icon={<Megaphone size={18} />} label={t("promotions")} />
            <PTNavLink to={`/settings/pt/${_id}`} icon={<Settings size={18} />} label={t("settings")} />
            <button
              onClick={async () => {
                try {
                  await logout(() => navigate("/"));
                  toast.success(t("logout_success"));
                } catch (err) {
                  console.error("Logout error:", err);
                  toast.error(t("logout_failed"));
                }
              }}
              className="flex items-center gap-3 text-black hover:text-caribbean hover:bg-alice px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>{t("logout")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PTDashboard() {
  return (
    <PTDashboardProvider>
      <PTDashboardContent />
    </PTDashboardProvider>
  );
}

/* -------------------------------
   Reusable NavLink Component
--------------------------------- */
const PTNavLink = ({ to, icon, label }) => {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-alice transition-colors text-gray-700 hover:text-caribbean"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};
