import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

export default function UpcomingAppointments({ appointments }) {
  const { t } = useTranslation();

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

  return (
    <div className="bg-white rounded-xl shadow p-4 m-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">
          {t("upcoming_appointments")}
        </h2>
        <button className="btn btn-sm p-1 bg-caribbean text-white hover:bg-tufts">
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
            {appointments.map((appt, i) => (
              <tr key={i}>
                <td>{appt.requester?.fullName}</td>
                <td>
                  {dayjs(appt.scheduledAt).format("ddd, DD/MM/YYYY")}
                </td>
                <td>{appt.clinic?.name}</td>

                <td className={`font-semibold ${getStatusClass(appt.status)}`}>
                  {t(`status_${appt.status?.toLowerCase()}`)}
                </td>

                <td>
                  {appt.status?.toLowerCase() === "pending" && (
                    <button className="btn btn-xs btn-outline btn-success mr-1">
                      {t("accept")}
                    </button>
                  )}

                  <button className="btn btn-xs btn-outline btn-info mr-1">
                    {t("view")}
                  </button>

                  <button className="btn btn-xs btn-outline btn-error">
                    {t("cancel")}
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
