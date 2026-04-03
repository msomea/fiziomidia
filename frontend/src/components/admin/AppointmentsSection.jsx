import { useEffect, useState } from "react";
import API from "../../api/axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { API_URL } from "../../config/constants";
import CollapsibleSection from "./CollapsibleSection";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../contexts/DashboardContext";

export default function AdminAppointments() {
  const { t } = useTranslation();
  const { appointments, refreshAppointments, loading: dashboardLoading } = useDashboard();

  const [search, setSearch] = useState("");
  const [clinic, setClinic] = useState("");
  const [pt, setPt] = useState("");
  const [requester, setRequester] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [clinic, pt, requester, status]);

  useEffect(() => {
    // Initial load when component mounts
    if (appointments.length === 0) {
      loadAppointments();
    }
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      await refreshAppointments({ search, clinic, pt, requester, status });
    } catch (error) {
      toast.error(t("failed_fetch_appointments"));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await API.put(`${API_URL}/admin/appointments/${id}`, { status: newStatus });
      toast.success(t("status_updated"));
      loadAppointments();
    } catch {
      toast.error(t("update_failed"));
    }
  };

  const deleteAppointment = async (id) => {
    const confirmDelete = window.confirm(t("confirm_delete_appointment"));
    if (!confirmDelete) return;

    try {
      await API.delete(`${API_URL}/admin/appointments/${id}`);
      toast.success(t("appointment_deleted"));
      loadAppointments();
    } catch {
      toast.error(t("delete_failed"));
    }
  };

  // Use dashboard loading state for initial load, local loading for refreshes
  const isLoading = dashboardLoading || loading;

  return (
    <CollapsibleSection title={t("appointments_management")}>
      <div className="space-y-4">
        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder={t("clinic_name")}
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder={t("pt_name")}
            value={pt}
            onChange={(e) => setPt(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder={t("requester_name")}
            value={requester}
            onChange={(e) => setRequester(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">{t("all_statuses")}</option>
            <option value="pending">{t("status_pending")}</option>
            <option value="accepted">{t("status_accepted")}</option>
            <option value="declined">{t("status_declined")}</option>
            <option value="cancelled">{t("status_cancelled")}</option>
            <option value="completed">{t("status_completed")}</option>
          </select>
        </div>

        {/* RESULTS */}
        <div className="mt-4">
          {isLoading ? (
            <div className="h-screen flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
              <p className="mt-4 text-caribbean font-medium animate-pulse">
                {t("loading_appointments")}
              </p>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 text-sm mt-20">{t("no_appointments_found")}</p>
          ) : (
            appointments.map((a) => (
              <div key={a._id} className="border rounded p-3 bg-gray-50 mb-3">
                <Link to={`/admin/appointments/${a._id}`}>
                  <h3 className="font-bold text-caribbean">
                    {t("appointment_number", { id: a._id })}
                  </h3>
                </Link>

                <div className="text-sm mt-2 text-tufts">
                  <p>
                    <span className="font-semibold">{t("clinic")}:</span>{" "}
                    {a.clinic?.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">{t("pt")}:</span>{" "}
                    {a.pt?.fullName || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">{t("requester")}:</span>{" "}
                    {a.requester?.fullName || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">{t("status")}:</span> {t(`status_${a.status}`)}
                  </p>
                  <p>
                    <span className="font-semibold">{t("requested_date")}:</span>{" "}
                    {dayjs(a.scheduledDate).format("ddd, DD/MM/YYYY")}
                  </p>
                  <p>
                    <span className="font-semibold">{t("requested_time")}:</span>{" "}
                    {a.scheduledTime}
                  </p>
                </div>

                <div className="flex gap-2 mt-3">
                  {["accepted", "declined", "cancelled", "completed"].map((s) => (
                    <button
                      key={s}
                      className="px-3 py-1 text-xs text-white bg-tufts hover:bg-gray-300 rounded"
                      onClick={() => updateStatus(a._id, s)}
                    >
                      {t("mark_status", { status: t(`status_${s}`) })}
                    </button>
                  ))}

                  <button
                    onClick={() => deleteAppointment(a._id)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-800"
                  >
                    {t("delete_appointment")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
