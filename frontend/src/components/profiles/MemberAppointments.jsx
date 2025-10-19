import React, { useEffect, useState } from "react";
import { getAppointmentsByMember } from "../../api/appointments";
import { useAuth } from "../../context/AuthContext"; // ✅ import auth context

const MemberAppointments = () => {
  const { user } = useAuth(); 
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      try {
        const data = await getAppointmentsByMember(user._id);
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      }
    };
    fetchData();
  }, [user]);

  return (
    <section className="bg-white p-5 rounded-2xl shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upcoming Appointments
      </h2>
      {appointments.length > 0 ? (
        <ul className="space-y-3">
          {appointments.map((a) => (
            <li
              key={a._id}
              className="flex justify-between border-b border-gray-100 pb-2"
            >
              <span>{a.physiotherapist?.name || "Physiotherapist"}</span>
              <span>{new Date(a.date).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No upcoming appointments.</p>
      )}
    </section>
  );
};

export default MemberAppointments;
