import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";

import Statistics from "../../components/dashboard/pt/Statistics";
import UpcomingAppointments from "../../components/dashboard/pt/UpcomingAppointments";
import ForumPosts from "../../components/dashboard/pt/ForumPosts";
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
} from "lucide-react";
import toast from "react-hot-toast";

export default function PTDashboard() {
  const { _id } = useParams(); // PT ID
  const { user } = useAuth();
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!user || !_id) return;

    const token = localStorage.getItem("accessToken");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      setLoading(true);
      try {
        const [ptRes, apptRes, forumRes, promoRes, statsRes] = await Promise.all([
          axios.get(`/api/pts/${_id}`, { headers }),
          axios.get(`/api/appointments?ptId=${_id}&limit=3`, { headers }),
          axios.get(`/api/forum?ptId=${_id}&limit=3`, { headers }),
          axios.get(`/api/promotions?ptId=${_id}`, { headers }),
          axios.get(`/api/pts/${_id}/dashboard-stats`, { headers }),
        ]);

        setPtProfile(ptRes.data); // PT profile object
        setAppointments(apptRes.data.appointments || []);
        setForumPosts(forumRes.data.posts || []);
        setPromotion(promoRes.data || null);
        setStats(statsRes.data || statsRes); // dashboard stats
        console.log(token)
        console.log("Returned Promotion", promotion)
      } catch (err) {
        console.error("Error loading PT dashboard:", err.response?.data || err.message);
        toast.error("Failed to load dashboard. Check console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, _id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-caribbean">
        Loading PT Dashboard...
      </div>
    );
  }

  if (!ptProfile) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Unable to load PT profile.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-alice mt-10 text-black p-4 md:p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-4">{ptProfile.fullName}'s Dashboard</h1>

      {/* Statistics Widget */}
      <Statistics stats={stats} />

      {/* Upcoming Appointments */}
      <UpcomingAppointments
        appointments={appointments}
        viewMore={`/appointments/${_id}`}
      />

      {/* Forum Posts & Promotion */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <ForumPosts posts={forumPosts} viewAll={`/forum/pt/${_id}`} />
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
            <PTNavLink to="/" icon={<Home size={18} />} label="Home" />
            <PTNavLink to={`/appointments/${_id}`} icon={<Calendar size={18} />} label="Appointments" />
            <PTNavLink to="/patients" icon={<Users size={18} />} label="Patients" />
            <PTNavLink to={`/forum/pt/${_id}`} icon={<MessageSquare size={18} />} label="Forum" />
            <PTNavLink to={`/promotions/pt/${_id}`} icon={<Megaphone size={18} />} label="Promotions" />
            <PTNavLink to={`/settings/pt/${_id}`} icon={<Settings size={18} />} label="Settings" />
            <button
              onClick={() => navigate("/logout")}
              className="flex items-center gap-3 text-black hover:text-caribbean hover:bg-alice px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
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
