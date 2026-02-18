import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import { Loader2, Trash2, X } from "lucide-react";

export default function MemberAppointmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const undoTimeouts = useRef({}); // track active timeouts
  const { id } = useParams();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await API.get(`${API_URL}/appointments/member/${id}`);
        setAppointments(data.appts);
      } catch (err) {
        toast.error(t("failed_load_appointments"));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [t, id]);

  const deleteAppointment = (appt) => {
    // Optimistic UI: remove immediately
    setAppointments((prev) => prev.filter((a) => a._id !== appt._id));

    const timeoutId = setTimeout(async () => {
      try {
        await API.delete(`${API_URL}/appointments/${appt._id}`);
      } catch (err) {
        toast.error(t("failed_delete_appointment"));
        setAppointments((prev) => [appt, ...prev]);
      } finally {
        delete undoTimeouts.current[appt._id];
      }
    }, 5000);

    undoTimeouts.current[appt._id] = timeoutId;

    toast((tObj) => (
      <div className="flex items-center justify-between gap-4">
        <span>{t("appointment_deleted")}</span>
        <button
          onClick={() => {
            clearTimeout(undoTimeouts.current[appt._id]); // cancel actual delete
            delete undoTimeouts.current[appt._id];
            setAppointments((prev) => [appt, ...prev]); // restore UI
            toast.dismiss(tObj.id);
            toast.success(t("undo_success"));
          }}
          className="text-blue-500 underline"
        >
          {t("undo")}
        </button>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_appointments")}
        </p>
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">{t("no_appointments_found")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 bg-gray-50 p-4">
      <div className="flex justify-between mb-3">
        <h2 className="font-semibold text-caribbean">{t("my_appointments")}</h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-4 text-tufts">
        {appointments.map((appt) => (
          <div
            key={appt._id}
            className="bg-white shadow rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center"
          >
            <div className="flex-1 space-y-1">
              <p>
                <span className="font-semibold">{t("physiotherapist")}: </span>
                {appt.pt?.fullName}
              </p>
              <p>
                <span className="font-semibold">{t("clinic")}: </span>
                {appt.clinic?.name}
              </p>
              <p>
                <span className="font-semibold">{t("date")}: </span>
                {dayjs(appt.scheduledAt).format("DD MMM YYYY HH:mm")}
              </p>
              <p>
                <span className="font-semibold">{t("status")}: </span>
                <span
                  className={`font-medium capitalize ${
                    appt.status === "pending"
                      ? "text-tufts"
                      : appt.status === "accepted"
                      ? "text-green-500"
                      : appt.status === "declined"
                      ? "text-red-600"
                      : appt.status === "cancelled"
                      ? "text-red-400"
                      : "text-gray-500"
                  }`}
                >
                  {t(`status_${appt.status?.toLowerCase()}`)}
                </span>
              </p>
            </div>

            <div className="flex gap-2 mt-3 sm:mt-0">
              <button
                onClick={() => deleteAppointment(appt)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                <Trash2 className="w-4 h-4" />
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
