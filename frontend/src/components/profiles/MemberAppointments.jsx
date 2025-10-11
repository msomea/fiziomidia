import React from "react";
import { Calendar, Clock } from "lucide-react";

const MemberAppointments = () => {
  const appointments = [
    {
      pt: "Dr. Jane Mwita",
      date: "Oct 15, 2025",
      time: "10:30 AM",
      status: "Confirmed",
    },
    {
      pt: "Dr. Kelvin Nyalusi",
      date: "Sep 28, 2025",
      time: "2:00 PM",
      status: "Completed",
    },
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">My Appointments</h2>
      <div className="space-y-3">
        {appointments.map((a, i) => (
          <div
            key={i}
            className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between"
          >
            <div>
              <h3 className="font-medium text-black">{a.pt}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-caribbean" />
                {a.date}
                <Clock className="w-4 h-4 text-caribbean ml-2" />
                {a.time}
              </div>
            </div>
            <span
              className={`mt-2 sm:mt-0 text-xs font-semibold px-3 py-1 rounded-full ${
                a.status === "Confirmed"
                  ? "bg-caribbean text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MemberAppointments;
