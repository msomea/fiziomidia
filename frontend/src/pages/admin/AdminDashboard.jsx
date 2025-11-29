import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchCurrentUser } from "../../api/auth";

import UsersSection from "../../components/admin/UsersSection"
import AppointmentsSection from "../../components/admin/AppointmentsSection";
import PromotionsSection from "../../components/admin/PromotionsSection";
import SponsorshipSection from "../../components/admin/SponsorshipSection";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

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
        <p className="text-gray-700 mb-6">
          Welcome, {user.fullName} ({user.role})
        </p>
      )}

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <UsersSection />
        <AppointmentsSection />
        <PromotionsSection />
        <SponsorshipSection />
      </div>
    </div>
  );
}
