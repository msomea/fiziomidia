import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { PTDashboardProvider, usePTDashboard } from "../../contexts/PTDashboardContext";
import Statistics from "../../components/dashboard/pt/Statistics";
import UpcomingAppointments from "../../components/dashboard/pt/UpcomingAppointments";
import ClinicAppointmentManagement from "../../components/dashboard/pt/ClinicAppointmentManagement";
import NotificationSection from "../../components/dashboard/NotificationSection";
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
    clinicAppointments,
    clinicPromotions,
    ptRequests,
    forumSubs,
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

          {/* Upcoming PT Appointments */}
          <UpcomingAppointments
            appointments={appointments}
            viewMore={`/pt/${user._id}/appointments`}
          />

          {/* Upcoming Clinic Appointments */}
          {clinics && clinics.length > 0 && clinics.some(clinic => clinic.ownerUserId?._id?.toString() === user._id?.toString()) && (
            <ClinicAppointmentManagement
              appointments={clinicAppointments}
              clinicId={clinics.find(clinic => clinic.ownerUserId?._id?.toString() === user._id?.toString())?._id} // Use first owned clinic
            />
          )}
          


          {/* Clinic Promotions */}
          <ClinicPromotionStatus clinics={clinics} clinicPromotions={clinicPromotions} />

          {/* Clinic Invitations */}
          <ClinicInvitations invitations={ptRequests} t={t} />

          {/* Forum & PT Promotion */}
          <div className="grid md:grid-cols-2 gap-4">
            <ForumSubManagement forumSubs={forumSubs} />
            <PromotionStatus
              promotion={promotion}
              extendLink={`/promotions/pt/${_id}`}
              addLink={`/promotions/pt/${_id}/add`}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <NotificationSection 
            notifications={notifications}
            markNotificationRead={markNotificationRead}
            userId={user._id}
          />
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
