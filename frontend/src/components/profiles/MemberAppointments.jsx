import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";
import { getAppointmentsByMember } from "../../api/appointments";

const MemberAppointments = ({ memberId, formData, setFormData }) => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const id = memberId || (await getProfile())._id;
      const data = await getAppointmentsByMember(id);
      setAppointments(data || []);
    };
    fetchAppointments();
  }, [memberId]);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Appointments</h2>
      {appointments.length ? (
        <ul className="space-y-3">
          {appointments.map((appt) => (
            <li key={appt._id} className="border p-2 rounded">
              <p className="text-sm text-gray-700">
                PT: {appt.pt.name} | Date: {new Date(appt.scheduledAt).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Status: {appt.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No appointments found.</p>
      )}
    </section>
  );
};

export default MemberAppointments;
