import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getMemberClinicAppointments } from "../../api/clinicAppointments";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { Loader2, X } from "lucide-react";

export default function PTClinicAppointmentPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const loadClinicAppointments = async () => {
      try {
        const data = await getMemberClinicAppointments();
        setAppointments(data.appointments || []);
      } catch (err) {
        toast.error(t("failed_load_appointments"));
      } finally {
        setLoading(false);
      }
    };

    loadClinicAppointments();
  }, [t, user?._id]);

  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter(
          (appt) => appt.status?.toLowerCase() === filter
        );

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

  return (
    <div className="max-w-6xl mt-16 bg-white shadow rounded-xl mx-auto px-6 sm:px-6 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-caribbean">
          {t("clinic_appointments")}
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

      {/* MOBILE VIEW (Cards) */}
      <div className="md:hidden space-y-3">
        {filteredAppointments.map((appt) => (
          <div
            key={appt._id}
            className="bg-white rounded-xl shadow p-4 border"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold text-caribbean">
                {appt.clinic?.name}
              </p>
              <span className="text-xs bg-alice px-2 py-1 rounded">
                {t(`status_${appt.status?.toLowerCase()}`)}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              {dayjs(appt.scheduledAt || `${appt.scheduledDate}T${appt.scheduledTime}`).format("DD MMM YYYY HH:mm")}
            </p>

            <p className="text-sm text-gray-600 mt-1">
              {appt.pt?.fullName ? `${t("assigned_pt")}: ${appt.pt.fullName}` : t("no_specific_pt")}
            </p>

            <p className="text-sm text-gray-600 mt-1">
              {appt.requester?.fullName ? `${t("patient")}: ${appt.requester?.fullName}` : t("no_patient")}
            </p>

            {appt.adminNotes && (
              <p className="text-sm text-gray-600 mt-1">
                {t("notes")}: {appt.adminNotes}
              </p>
            )}

            <button
              onClick={() =>
                navigate(`/pt/clinic-appointments/${appt._id}`)
              }
              className="mt-3 w-full btn btn-sm bg-caribbean text-white hover:bg-tufts"
            >
              {t("view_details")}
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP VIEW (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-alice text-caribbean">
              <th>{t("clinic")}</th>
              <th>{t("date")}</th>
              <th>{t("assigned_pt")}</th>
              <th>{t("patient")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredAppointments.map((appt) => (
              <tr key={appt._id} className="text-tufts">
                <td>{appt.clinic?.name}</td>
                <td>
                  {dayjs(appt.scheduledAt || `${appt.scheduledDate}T${appt.scheduledTime}`).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </td>
                <td>
                  {appt.pt?.fullName || t("no_specific_pt")}
                </td>
                <td>
                  {appt.requester?.fullName || t("no_patient")}
                </td>
                <td>
                  {t(`status_${appt.status?.toLowerCase()}`)}
                </td>
                <td>
                  <button
                    onClick={() =>
                      navigate(`/pt/clinic-appointments/${appt._id}`)
                    }
                    className="btn btn-xs btn-outline btn-info"
                  >
                    {t("view_details")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAppointments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>{t("no_appointments_found")}</p>
        </div>
      )}
    </div>
  );
}
