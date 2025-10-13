import { useState } from "react";
import Statistics from "../../components/dashboard/Statistics";
import UpcomingAppointments from "../../components/dashboard/UpcomingAppointments";
import ForumPosts from "../../components/dashboard/ForumPosts";
import PromotionStatus from "../../components/dashboard/PromotionStatus";
import { Menu, X, Home, Calendar, Users, MessageSquare, Megaphone, Settings, LogOut } from "lucide-react";
import { Link } from "react-router";

export default function PTDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const stats = [
    { title: "Today’s Appointments", value: 4 },
    { title: "Upcoming", value: 12 },
    { title: "Pending Requests", value: 3 },
    { title: "Promotion Days Left", value: 7 },
  ];

  const appointments = [
    { patient: "Jane Doe", time: "10:30 AM", type: "Rehab", status: "Confirmed" },
    { patient: "Mark Elias", time: "11:00 AM", type: "Exercise Therapy", status: "Pending" },
    { patient: "Asha Mushi", time: "1:00 PM", type: "Home Visit", status: "Confirmed" },
  ];

  const posts = [
    { title: "The role of balance training in elderly care", date: "2 days ago" },
    { title: "Stretching for lower back pain relief", date: "5 days ago" },
  ];

  const promotion = { daysLeft: 7, renewalDate: "Oct 20, 2025" };

  return (
    <div className="relative min-h-screen bg-alice text-black p-4 md:p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-4">My Dashboard</h1>

      {/* Dashboard Content */}
      <Statistics stats={stats} />
      <UpcomingAppointments appointments={appointments} />

      <div className="grid md:grid-cols-2 gap-4">
        <ForumPosts posts={posts} />
        <PromotionStatus promotion={promotion} />
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
            <PTNavLink to="/" icon={<Home size={18} />} label="Home" />
            <PTNavLink to="/dashboard/pt/:id" icon={<Calendar size={18} />} label="Appointments" />
            <PTNavLink to="/patients" icon={<Users size={18} />} label="Patients" />
            <PTNavLink to="/forum" icon={<MessageSquare size={18} />} label="Forum" />
            <PTNavLink to="/promotions" icon={<Megaphone size={18} />} label="Promotions" />
            <PTNavLink to="/settings/pt/:id" icon={<Settings size={18} />} label="Settings" />
            <PTNavLink to="/logout" icon={<LogOut size={18} />} label="Logout" />
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
