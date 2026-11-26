import { useEffect, useState, useMemo, useCallback } from "react";
import { updateAppointmentStatus, deleteAppointment as deleteAppointmentApi } from "../../api/appointments";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { RefreshCw, Trash2 } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import ResourceStatusBadge from "../education/ResourceStatusBadge";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../contexts/DashboardContext";
import { performUnifiedSearch } from "../../api/admin";

export default function AdminAppointments() {
  const { t } = useTranslation();
  const { appointments, loading: dashboardLoading } = useDashboard();

  const [search, setSearch] = useState("");
  const [clinic, setClinic] = useState("");
  const [pt, setPt] = useState("");
  const [requester, setRequester] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await performUnifiedSearch({
        types: ['appointments'],
        search,
        filters: {
          clinic,
          pt,
          requester,
          status
        },
        limit: 20
      });

      // Update local state with filtered results
      setFilteredAppointments(result.appointments || []);
    } catch (error) {
      console.error('Failed to load appointments via unified search:', error);
      toast.error(t("failed_fetch_appointments"));
    } finally {
      setLoading(false);
    }
  }, [search, clinic, pt, requester, status, t]);

  useEffect(() => {
    // Load appointments when filters change (also runs on mount)
    loadAppointments();
  }, [loadAppointments]);

  const updateStatus = async (id, newStatus) => {
    setBusy(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      toast.success(t("status_updated"));
      loadAppointments();
    } catch {
      toast.error(t("failed_update_status"));
    } finally {
      setBusy(null);
    }
  };

  const deleteAppointment = async (id) => {
    const confirmDelete = window.confirm(t("confirm_delete_appointment"));
    if (!confirmDelete) return;

    setBusy(id);
    try {
      await deleteAppointmentApi(id);
      toast.success(t("appointment_deleted"));
      loadAppointments();
    } catch {
      toast.error(t("failed_delete_appointment"));
    } finally {
      setBusy(null);
    }
  };

  // Stats derived from the full appointments dataset in context
  const stats = useMemo(() => {
    const source = Array.isArray(appointments) ? appointments : [];
    return {
      total: source.length,
      pending: source.filter((a) => a.status === "pending").length,
      accepted: source.filter((a) => a.status === "accepted").length,
      completed: source.filter((a) => a.status === "completed").length,
      cancelled: source.filter((a) => a.status === "cancelled").length,
      declined: source.filter((a) => a.status === "declined").length,
    };
  }, [appointments]);

  const isLoading = dashboardLoading || loading;
  const displayAppointments = filteredAppointments;

  return (
    <CollapsibleSection title={t("appointments_management")}>
      <div className="flex justify-end mb-3">
        <button onClick={loadAppointments} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {[
            ["stat_total", stats.total],
            ["status_pending", stats.pending],
            ["status_accepted", stats.accepted],
            ["status_completed", stats.completed],
            ["status_cancelled", stats.cancelled],
            ["status_declined", stats.declined],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          placeholder={t("clinic_name")}
          value={clinic}
          onChange={(e) => setClinic(e.target.value)}
          className="input input-bordered input-xs"
        />
        <input
          type="text"
          placeholder={t("pt_name")}
          value={pt}
          onChange={(e) => setPt(e.target.value)}
          className="input input-bordered input-xs"
        />
        <input
          type="text"
          placeholder={t("requester_name")}
          value={requester}
          onChange={(e) => setRequester(e.target.value)}
          className="input input-bordered input-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select select-bordered select-xs"
        >
          <option value="">{t("all_statuses")}</option>
          <option value="pending">{t("status_pending")}</option>
          <option value="accepted">{t("status_accepted")}</option>
          <option value="declined">{t("status_declined")}</option>
          <option value="cancelled">{t("status_cancelled")}</option>
          <option value="completed">{t("status_completed")}</option>
        </select>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setSearch("");
            setClinic("");
            setPt("");
            setRequester("");
            setStatus("");
          }}
          className="btn btn-xs btn-outline border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white"
        >
          {t("filter_all")}
        </button>
      </div>

      {/* RESULTS */}
      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : displayAppointments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t("no_appointments_found")}</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {displayAppointments.map((a) => (
            <div key={a._id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
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
                      <span className="font-semibold">{t("requested_date")}:</span>{" "}
                      {dayjs(a.scheduledDate).format("ddd, DD/MM/YYYY")}
                    </p>
                    <p>
                      <span className="font-semibold">{t("requested_time")}:</span>{" "}
                      {a.scheduledTime}
                    </p>
                  </div>
                </div>
                <ResourceStatusBadge status={a.status} />
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {["accepted", "declined", "cancelled", "completed"].map((s) => (
                  <button
                    key={s}
                    disabled={busy === a._id}
                    className="btn btn-xs btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
                    onClick={() => updateStatus(a._id, s)}
                  >
                    {t("mark_status", { status: t(`status_${s}`) })}
                  </button>
                ))}

                <button
                  disabled={busy === a._id}
                  onClick={() => deleteAppointment(a._id)}
                  className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-3 h-3" /> {t("delete_appointment")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}
