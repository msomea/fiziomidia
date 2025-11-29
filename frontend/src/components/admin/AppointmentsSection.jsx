import { useEffect, useState } from "react";
import { fetchAdminAppointments } from "../../api/admin";
import toast from "react-hot-toast";
import CollapsibleSection from "./CallapsibleSection";

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
    <CollapsibleSection title="Appointments">
      {appointments.length === 0 && (
        <p className="text-tufts mt-2 text-sm">No appointments found.</p>
      )}

      {appointments.map((a) => (
        <div
          key={a._id}
          className="mt-3 p-2 border rounded bg-gray-50 text-sm text-tufts"
        >
          <p><b>Clinic:</b> {a.clinic.name}</p>
          <p><b>PT:</b> {a.pt?.fullName}</p>
          <p><b>Requester:</b> {a.requester?.fullName}</p>
        </div>
      ))}
    </CollapsibleSection>
  );
}
