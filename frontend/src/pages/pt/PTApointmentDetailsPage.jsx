import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { Loader2, X } from "lucide-react";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";

export default function PTAppointmentDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data } = await API.get(`${API_URL}/appointments/${id}`);
        setAppointment(data.appointment);
      } catch (err) {
        toast.error(t("failed_load_appointment"));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, t]);

  const updateStatus = async (status) => {
    try {
      setUpdating(true);

      await API.patch(`${API_URL}/appointments/${id}/status`, {
        status,
      });

      setAppointment((prev) => ({ ...prev, status }));
      toast.success(t("status_updated"));
    } catch {
      toast.error(t("failed_update_status"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_appointment")}
        </p>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="min-h-screen mt-16 bg-gray-50 flex flex-col">

      {/* Sticky Header */}
      <div className="sticky top-0 bg-white z-10 shadow-sm px-4 py-3 flex justify-between items-center">
        <h3 className="font-semibold text-caribbean text-lg">
          {t("manage_appointment")}
        </h3>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 max-w-2xl w-full mx-auto">

        <div className="bg-white rounded-xl shadow p-4 space-y-3 text-tufts">

          <div>
            <p className="text-sm text-gray-500">{t("patient")}</p>
            <p className="font-medium">{appointment.requester?.fullName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("email")}</p>
            <p className="font-medium break-all">
              {appointment.requester?.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("clinic")}</p>
            <p className="font-medium">{appointment.clinic?.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("scheduled_at")}</p>
            <p className="font-medium">
              {dayjs(appointment.scheduledAt).format(
                "DD MMM YYYY • HH:mm"
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("status")}</p>
            <p className="font-semibold capitalize">
              {t(`status_${appointment.status?.toLowerCase()}`)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">

          {appointment.status === "pending" && (
            <>
              <button
                disabled={updating}
                onClick={() => updateStatus("accepted")}
                className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition disabled:opacity-50"
              >
                {updating ? t("processing") : t("accept")}
              </button>

              <button
                disabled={updating}
                onClick={() => updateStatus("declined")}
                className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition disabled:opacity-50"
              >
                {t("decline")}
              </button>
            </>
          )}

          {appointment.status === "accepted" && (
            <button
              disabled={updating}
              onClick={() => updateStatus("cancelled")}
              className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          )}

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-lg bg-gray-400 hover:bg-gray-700 font-medium transition"
          >
            {t("back")}
          </button>

        </div>
      </div>
    </div>
  );
}
