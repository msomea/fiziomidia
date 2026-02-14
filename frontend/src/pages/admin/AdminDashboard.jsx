import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { fetchCurrentUser } from "../../api/auth";
import { Settings } from "lucide-react";
import UsersSection from "../../components/admin/UsersSection"
import AppointmentsSection from "../../components/admin/AppointmentsSection";
import PromotionsSection from "../../components/admin/PromotionsSection";
import SponsorshipSection from "../../components/admin/SubSponsorshipSection";
import SponsoredProductsSection from "../../components/admin/ProductSponsorshipSection";
import ForumModRequestsSection from "../../components/admin/ForumModRequestsSection";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  return (
    <div className="p-6 mt-16">
      <h1 className="text-3xl text-caribbean font-bold mb-4">Admin Dashboard</h1>

      {user && (
        <div className="bg-white shadow-md rounded-2xl p-4 mb-6 flex items-center justify-between">
          
          {/* Left Side: Avatar + Info */}
          <div className="flex items-center gap-4">
            <img
              src={
                user.profileImageUrl ||
                "https://ui-avatars.com/api/?name=Admin&background=00CC99&color=fff"
              }
              alt="Admin Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-caribbean shadow-sm"
            />

            <div>
              <p className="text-lg font-semibold text-gray-800">
                {user.fullName}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                For administrative work please use Laptop or Desktop
              </p>
            </div>
          </div>

          {/* Right Side: Settings Button */}
          <button
            onClick={() => navigate("/settings/admin")}
            className="flex items-center gap-2 px-4 py-2 
                      border-2 border-caribbean text-caribbean 
                      rounded-lg font-medium 
                      hover:bg-caribbean hover:text-white 
                      transition-all duration-200"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      )}


      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <UsersSection />
        <AppointmentsSection />
        <PromotionsSection />
        <SponsorshipSection />
        <ForumModRequestsSection />
        <SponsoredProductsSection />
      </div>
      
    </div>
  );
}
