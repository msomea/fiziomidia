import { useEffect, useState } from "react";
import { fetchAdminAppointments } from "../../api/admin";
import toast from "react-hot-toast";

export default function AppointmentsSection() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAdminAppointments();
        setAppointments(res.appts);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch Appointments");
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 bg-white shadow rounded overflow-y-auto max-h-[300px]">
      <h2 className="font-bold text-caribbean text-lg">Appointments</h2>

      {appointments.length === 0 && (
        <p className="text-tufts mt-2 text-sm">No appointments found.</p>
      )}

      {appointments.map((a) => (
        <div
          key={a._id}
          className="mt-3 p-2 border rounded bg-gray-50 text-sm text-tufts"
        >
          <p><b>Clinic:</b> {a.clinic.name}</p>
          <p><b>PT:</b> {a.pt?.fullName || a.pt}</p>
          <p><b>Requester:</b> {a.requester?.fullName || a.requester}</p>
        </div>
      ))}
    </div>
  );
}
