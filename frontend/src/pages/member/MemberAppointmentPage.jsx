import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getAppointmentsByMember, deleteAppointment } from "../../api/appointments";
import toast from "react-hot-toast";
import { Loader2, X, Trash2 } from "lucide-react";

export default function MemberAppointmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const undoTimeouts = useRef({});

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const appointments = await getAppointmentsByMember(id);
        setAppointments(appointments);
      } catch (err) {
        toast.error(t("failed_load_appointments"));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [t, id]);

  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter(
          (appt) => appt.status?.toLowerCase() === filter
        );

  const handleDeleteAppointment = async (e, appt) => {
    e.stopPropagation();
    
    const backup = [...appointments];
    const toastId = Date.now(); // Unique ID for this delete operation
    
    // Immediately update UI
    setAppointments((prev) => prev.filter((a) => a._id !== appt._id));

    // Show toast with undo option
    const toastUndo = toast((tObj) => (
      <div className="flex items-center gap-3">
        <span>{t("appointment_deleted")}</span>
        <button
          onClick={() => {
            // Clear the timeout
            if (undoTimeouts.current[toastId]) {
              clearTimeout(undoTimeouts.current[toastId]);
              delete undoTimeouts.current[toastId];
            }
            // Restore the appointments
            setAppointments(backup);
            // Dismiss the toast
            toast.dismiss(tObj.id);
            // Show success message
            toast.success(t("undo_success"));
          }}
          className="text-blue-500 underline"
        >
          {t("undo")}
        </button>
      </div>
    ));

    // Set timeout for actual deletion
    const timeoutId = setTimeout(async () => {
      try {
        await deleteAppointment(appt._id);
        // Clean up the timeout reference
        delete undoTimeouts.current[toastId];
      } catch (error) {
        // Restore the appointments on error
        setAppointments(backup);
        toast.error(t("failed_delete_appointment"));
        // Clean up the timeout reference
        delete undoTimeouts.current[toastId];
      }
    }, 5000);

    // Store the timeout reference
    undoTimeouts.current[toastId] = timeoutId;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-caribbean animate-spin" />
        <p className="mt-3 text-caribbean animate-pulse">
          {t("loading_appointment")}
        </p>
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 font-medium">{t("no_appointments_found")}</p>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mt-16 bg-white shadow rounded-xl mx-auto px-6 sm:px-6 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-caribbean">
          {t("my_appointments")}
        </h3>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-800" />
        </button>
      </div>

      {/* Filter Tabs (Scrollable on Mobile) */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {["all", "pending", "accepted", "cancelled", "declined"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm border transition ${
                filter === status
                  ? "bg-caribbean text-white"
                  : "bg-tufts hover:bg-gray-200 hover:text-caribbean"
              }`}
            >
              {t(`status_${status}`)}
            </button>
          )
        )}
      </div>

      {/* 🟢 MOBILE VIEW (Cards) */}
      {filteredAppointments.length > 0 ? (
        <div className="md:hidden space-y-3">
          {filteredAppointments.map((appt) => (
          <div
            key={appt._id}
            className="bg-white rounded-xl shadow p-4 border"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold text-caribbean">
                {appt.pt?.fullName}
              </p>
              <span className="text-xs bg-alice px-2 py-1 rounded">
                {t(`status_${appt.status?.toLowerCase()}`)}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              {dayjs(appt.scheduledAt || `${appt.scheduledDate}T${appt.scheduledTime}`).format("DD MMM YYYY HH:mm")}
            </p>

            <p className="text-sm text-gray-600 mt-1">
              {appt.clinic?.name}
            </p>

            <button
              onClick={(e) => handleDeleteAppointment(e, appt)}
              className="mt-3 w-full btn btn-sm bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t("delete")}
            </button>
          </div>
        ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 font-medium">
            {t("no_appointments_found_for_filter", { filter: t(`status_${filter}`) })}
          </p>
        </div>
      )}

      {/* 🔵 DESKTOP VIEW (Table) */}
      {filteredAppointments.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="table w-full">
          <thead>
            <tr className="bg-alice text-caribbean">
              <th>{t("physiotherapist")}</th>
              <th>{t("date")}</th>
              <th>{t("clinic")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredAppointments.map((appt) => (
              <tr key={appt._id} className="text-tufts">
                <td>{appt.pt?.fullName}</td>
                <td>
                  {dayjs(appt.scheduledAt || `${appt.scheduledDate}T${appt.scheduledTime}`).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </td>
                <td>{appt.clinic?.name}</td>
                <td>
                  {t(`status_${appt.status?.toLowerCase()}`)}
                </td>
                <td>
                  <button
                    onClick={(e) => handleDeleteAppointment(e, appt)}
                    className="btn btn-xs btn-outline btn-error"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
