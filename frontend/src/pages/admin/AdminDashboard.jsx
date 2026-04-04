import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { fetchCurrentUser } from "../../api/auth";
import { Settings } from "lucide-react";
import { useTranslation } from 'react-i18next'
import { DashboardProvider, useDashboard } from "../../contexts/DashboardContext";
import UsersSection from "../../components/admin/UsersSection"
import AppointmentsSection from "../../components/admin/AppointmentsSection";
import PromotionsSection from "../../components/admin/PromotionsSection";
import SponsorshipSection from "../../components/admin/SubSponsorshipSection";
import SponsoredProductsSection from "../../components/admin/ProductSponsorshipSection";
import ClinicPromotionSection from "../../components/admin/ClinicPromotionSection";
import ForumModRequestsSection from "../../components/admin/ForumModRequestsSection";
import AdminMonitoringSection from "../../components/admin/AdminMonitoringSection";

function AdminDashboardContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation()
  const { fetchDashboardData, loading, error } = useDashboard();

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load admin data");
      }
    };
    load();
  }, []);

  useEffect(() => {
    // Fetch all dashboard data at once - only run once on mount
    fetchDashboardData();
  }, []); // Remove fetchDashboardData from dependency array

  return (
    <div className="p-6 mt-16">
      <h1 className="text-3xl text-caribbean font-bold mb-4">{t('admin_dashboard')}</h1>

      {user && (
        <div className="bg-white shadow-md rounded-2xl p-4 mb-6 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <img
              src={ user.profileImageUrl }
              alt="Admin Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-caribbean shadow-sm"
            />

            <div>
              <p className="text-lg font-semibold text-gray-800">
                {user.fullName}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">{t('admin_device_notice')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean"></div>
          <span className="ml-3 text-caribbean font-medium">Loading dashboard...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">{t('error_loading_dashboard')}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AdminMonitoringSection />
        <UsersSection />
        <AppointmentsSection />
        <PromotionsSection />
        <ClinicPromotionSection />
        <SponsorshipSection />
        <ForumModRequestsSection />
        <SponsoredProductsSection />
      </div>
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={() => navigate("/settings/admin")}
          className="flex items-center gap-2 px-4 py-2 
                    border-2 border-caribbean text-caribbean 
                    rounded-lg font-medium 
                    hover:bg-caribbean hover:text-white 
                    transition-all duration-200"
        >
          <Settings size={18} />
          {t('admin_settings')}
        </button>
      </div>

      
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardProvider>
      <AdminDashboardContent />
    </DashboardProvider>
  );
}
