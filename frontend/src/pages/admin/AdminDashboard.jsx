import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchCurrentUser } from "../../api/auth";
import { fetchAppointments } from "../../api/appointments";


export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  // const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load admin data");
      }
    };
    loadUser();

    // const loadAppointment = async () => {
    //   try {
    //     const currentAppointments = await fetchAppointments();
    //     setAppointments(currentAppointments);
    //   } catch (error) {
    //     console.error(error);
    //     toast.error("Failed to fetch Appointments");
    //   }
    // };
    // loadAppointment();

  }, []);


  return (
    <div className="p-6 mt-16">
      <h1 className="text-3xl text-caribbean font-bold mb-4">Admin Dashboard</h1>
      {user && (
        <p className="text-gray-700 mb-6">
          Welcome, {user.name} ({user.role})
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-bold text-caribbean text-lg">Users</h2>
          <p className="text-gray-600 mt-2">Manage registered users  here.</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-bold text-caribbean text-lg">Appointments</h2>
          <h2 className="font-bold text-caribbean text-lg">Clinic: </h2>
          <p className="text-gray-600 mt-2">PT: </p>
          <p className="text-gray-600 mt-2">Requester: </p>

          {/* {appointments.map((appointment) => {
            return (
              <>
              <h2 className="font-bold text-caribbean text-lg">Clinic: {appointment.clinic}</h2>
              <p className="text-gray-600 mt-2">PT: {appointment.pt}</p>
              <p className="text-gray-600 mt-2">Requester: {appointment.requester}</p>
              </>
            )
          })} */}

        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-bold text-caribbean text-lg">Reports</h2>
          <p className="text-gray-600 mt-2">Check system analytics and logs.</p>
        </div>
      </div>
    </div>
  );
}
