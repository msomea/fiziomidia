import React, { useEffect, useState } from "react";
import { getAppointmentsByMember } from "../../api/appointments";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const MemberAppointments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const data = await getAppointmentsByMember(user._id);
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        setError(t("appointments_load_error"));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, t]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "accepted":
        return "text-green-600";
      case "declined":
      case "cancelled":
        return "text-red-600";
      case "completed":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin text-gray-500" size={40} />
      </div>
    );
  }

  return (
    <section className="bg-white p-6 rounded-2xl shadow-md mt-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-5">
        {t("upcoming_appointments")}
      </h2>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      {appointments.length > 0 ? (
        <ul className="space-y-4">
          {appointments.map((a) => (
            <li
              key={a._id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium text-gray-800">
                  {a.pt?.fullName || t("physiotherapist")}
                </span>
                {a.pt?.specialization && (
                  <span className="text-gray-500 text-sm">
                    ({a.pt.specialization})
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1 sm:mt-0">
                <span className="text-gray-600 text-sm">
                  {new Date(a.scheduledDate).toLocaleDateString()} {a.scheduledTime}
                </span>
                <span className={`font-medium ${getStatusColor(a.status)}`}>
                  {t(`appointment_status.${a.status}`)}
                </span>
              </div>

              {a.notes && (
                <p className="text-gray-500 text-sm mt-1 sm:mt-0 italic">
                  {t("notes")}: {a.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">{t("no_upcoming_appointments")}</p>
      )}
    </section>
  );
};

export default MemberAppointments;
