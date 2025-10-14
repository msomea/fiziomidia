import React, { useEffect, useState } from "react";
import { getAppointmentsByMember } from "../../api/appointments";
import { useParams } from "react-router";

const MemberAppointments = () => {
  const { id } = useParams();
  const [appointments, setAppointments] = useState([]); // ✅ starts as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await getAppointmentsByMember(id);
        setAppointments(data || []); // ✅ fallback to empty array
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [id]);

  if (loading) {
    return <p className="text-gray-600 text-center">Loading appointments...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center">{error}</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-caribbean">My Appointments</h2>

      {appointments.length > 0 ? (
        <ul>
          {appointments.map((appt) => (
            <li key={appt._id} className="p-4 mb-3 bg-white rounded-lg shadow-sm">
              <p>
                <strong>Physiotherapist:</strong> {appt.pt?.name || "Unknown"}
              </p>
              <p>
                <strong>Status:</strong> {appt.status || "Pending"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {appt.createdAt
                  ? new Date(appt.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No appointments found.</p>
      )}
    </div>
  );
};

export default MemberAppointments;
