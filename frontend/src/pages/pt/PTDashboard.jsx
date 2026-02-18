import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";
import Statistics from "../../components/dashboard/pt/Statistics";
import UpcomingAppointments from "../../components/dashboard/pt/UpcomingAppointments";
import ForumSubManagement from "../../components/dashboard/pt/ForumSubManagement";
import PromotionStatus from "../../components/dashboard/pt/PromotionStatus";

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

export default function PTDashboard() {
  const { t } = useTranslation();
  const { _id } = useParams(); // PT ID
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [ptProfile, setPtProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [promotion, setPromotion] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingRequests: 0,
    totalForumPosts: 0,
    promotionDaysLeft: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!user || !_id || user._id === null) return;

    const token = localStorage.getItem("accessToken");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      setLoading(true);
      try {
        const [ptRes, apptRes, forumRes, promoRes, statsRes] = await Promise.all([
          API.get(`${API_URL}/pts/${_id}`, { headers }),
          API.get(`${API_URL}/appointments?ptId=${_id}&limit=3`, { headers }),
          API.get(`${API_URL}/forum?ptId=${_id}&limit=3`, { headers }),
          API.get(`${API_URL}/promotions?ptId=${_id}`, { headers }),
          API.get(`${API_URL}/pts/${_id}/dashboard-stats`, { headers }),
        ]);

        setPtProfile(ptRes.data);
        setAppointments(apptRes.data.appointments || []);
        setForumPosts(forumRes.data.posts || []);
        setPromotion(promoRes.data || null);
        setStats(statsRes.data || statsRes);
      } catch (err) {
        console.error("Error loading PT dashboard:", err.response?.data || err.message);
        toast.error(t("dashboard_load_error"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, _id, t]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-caribbean">
        <LoaderIcon className="animate-spin size-10" />
        {t("loading_dashboard")}
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
      {/* Header */}
      <h1 className="text-2xl font-bold mb-4">
        {ptProfile.fullName} {t("dashboard_title")}
      </h1>

      {/* Statistics Widget */}
      <Statistics stats={stats} />

      {/* Upcoming Appointments */}
      <UpcomingAppointments
        appointments={appointments}
        viewMore={`/pt/${user._id}/appointments`}
      />

      {/* Forum & Promotion */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <ForumSubManagement />
        <PromotionStatus
          promotion={promotion}
          extendLink={`/promotions/pt/${_id}`}
          addLink={`/promotions/pt/${_id}/add`}
        />
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
