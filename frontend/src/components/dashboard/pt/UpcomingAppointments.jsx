import { use, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import API from "../../../api/axios";
import { API_URL } from "../../../config/constants";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";



export default function UpcomingAppointments({ appointments, viewMore }) {
  const { t } = useTranslation();
  const [localAppointments, setLocalAppointments] = useState(appointments);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "text-caribbean";
      case "pending":
        return "text-tufts";
      case "cancelled":
        return "text-red-400";
      case "declined":
        return "text-red-800";
      default:
        return "text-gray-500";
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);

      await API.patch(`${API_URL}/appointments/${id}/status`, {
        status: newStatus,
      });

      // Optimistic update
      setLocalAppointments((prev) =>
        prev.map((appt) =>
          appt._id === id ? { ...appt, status: newStatus } : appt
        )
      );

      toast.success(t("status_updated"));
    } catch (err) {
      toast.error(t("failed_update_status"));
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 my-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">
          {t("upcoming_appointments")}
        </h2>
        <button
          onClick={() => navigate(viewMore)}
          className="btn btn-sm p-1 bg-caribbean text-white hover:bg-tufts">
          {t("view_all")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-auto w-full">
          <thead>
            <tr className="bg-alice text-caribbean">
              <th>{t("patient")}</th>
              <th>{t("date_time")}</th>
              <th>{t("clinic")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {localAppointments.map((appt) => (
              <tr key={appt._id}>
                <td>{appt.requester?.fullName}</td>

                <td>
                  {dayjs(appt.scheduledAt).format("ddd, DD/MM/YYYY")}
                </td>

                <td>{appt.clinic?.name}</td>

                <td className={`font-semibold ${getStatusClass(appt.status)}`}>
                  {t(`status_${appt.status?.toLowerCase()}`)}
                </td>

                <td className="space-x-1">
                  {appt.status?.toLowerCase() === "pending" && (
                    <>
                      <button
                        disabled={updatingId === appt._id}
                        onClick={() => updateStatus(appt._id, "accepted")}
                        className="btn btn-xs btn-outline btn-success"
                      >
                        {t("accept")}
                      </button>

                      <button
                        disabled={updatingId === appt._id}
                        onClick={() => updateStatus(appt._id, "declined")}
                        className="btn btn-xs btn-outline btn-warning"
                      >
                        {t("decline")}
                      </button>
                    </>
                  )}

                  {appt.status?.toLowerCase() === "accepted" && (
                    <button
                      disabled={updatingId === appt._id}
                      onClick={() => updateStatus(appt._id, "cancelled")}
                      className="btn btn-xs btn-outline btn-error"
                    >
                      {t("cancel")}
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/pt/appointments/${appt._id}`)}
                    className="btn btn-xs btn-outline btn-info">
                    {t("view")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
