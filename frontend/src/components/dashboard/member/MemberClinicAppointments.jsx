import { useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function MemberClinicAppointments({ appointments, viewMore }) {
  const { t } = useTranslation();
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

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 my-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">
            {t("clinic_appointments")}
          </h2>
          <button
            onClick={() => navigate(viewMore)}
            className="btn btn-sm p-1 bg-caribbean text-white hover:bg-tufts">
            {t("view_all")}
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>{t("no_clinic_appointments")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 my-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">
          {t("clinic_appointments")}
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
              <th>{t("clinic")}</th>
              <th>{t("date_time")}</th>
              <th>{t("assigned_pt")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {appointments.map((appt) => (
              <tr key={appt._id}>
                <td>
                  <div>
                    <div className="font-medium">{appt.clinic?.name}</div>
                    {appt.clinic?.address && (
                      <div className="text-sm text-gray-500">{appt.clinic.address}</div>
                    )}
                  </div>
                </td>

                <td>
                  <div>
                    <div>{dayjs(appt.scheduledAt || appt.scheduledDate).format("ddd, DD/MM/YYYY")}</div>
                    <div className="text-sm text-gray-500">
                      {dayjs(appt.scheduledAt || appt.scheduledDate).format("HH:mm")}
                    </div>
                  </div>
                </td>

                <td>
                  {appt.pt ? (
                    <div className="text-sm">
                      <div className="font-medium">{appt.pt.fullName}</div>
                      {appt.pt.ptProfile?.speciality && (
                        <div className="text-gray-500">{appt.pt.ptProfile.speciality}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">{t("no_specific_pt")}</span>
                  )}
                </td>

                <td className={`font-semibold ${getStatusClass(appt.status)}`}>
                  {t(`status_${appt.status?.toLowerCase()}`)}
                </td>

                <td className="space-x-1">
                  <button
                    onClick={() => navigate(`/member/appointments/${appt._id}`)}
                    className="btn btn-xs btn-outline btn-info">
                    {t("view_details")}
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
