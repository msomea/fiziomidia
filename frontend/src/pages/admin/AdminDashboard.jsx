import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../../api/auth";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load admin data");
      }
    };
    loadUser();
  }, []);

  return (
    <div className="p-6 mt-16">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      {user && (
        <p className="text-gray-700 mb-6">
          Welcome, {user.name} ({user.role})
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-bold text-lg">Users</h2>
          <p className="text-gray-600 mt-2">Manage registered users  here.</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-bold text-lg">Promotions</h2>
          <p className="text-gray-600 mt-2">View or approve active promotions.</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-bold text-lg">Reports</h2>
          <p className="text-gray-600 mt-2">Check system analytics and logs.</p>
        </div>
      </div>
    </div>
  );
}
