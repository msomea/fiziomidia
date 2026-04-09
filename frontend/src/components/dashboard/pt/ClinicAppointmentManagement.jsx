import { useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { updateClinicAppointmentStatus, getClinicPTsForAssignment } from "../../../api/clinicAppointments";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
export default function ClinicAppointmentManagement({ appointments, clinicId }) {
  const { t } = useTranslation();  
  const [updatingId, setUpdatingId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [availablePTs, setAvailablePTs] = useState([]);
  const [selectedPT, setSelectedPT] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
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

  const fetchAvailablePTs = async () => {
    try {
      const response = await getClinicPTsForAssignment(clinicId);
      setAvailablePTs(response.pts);
    } catch (error) {
      console.error("Failed to fetch available PTs:", error);
      toast.error(t("failed_load_pts"));
    }
  };

  const openAssignModal = async (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedPT(appointment.pt?._id || "");
    setAdminNotes(appointment.adminNotes || "");
    setShowAssignModal(true);
    await fetchAvailablePTs();
  };

  const updateStatus = async (id, newStatus, assignedPT = null, notes = null) => {
    try {
      setUpdatingId(id);

      const updateData = { status: newStatus };
      if (assignedPT) updateData.assignedPT = assignedPT;
      if (notes) updateData.notes = notes;

      const response = await updateClinicAppointmentStatus(id, updateData);

      toast.success(t("status_updated"));
      setShowAssignModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("failed_update_status"));
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptAppointment = () => {
    if (!selectedPT && !selectedAppointment.pt) {
      toast.error(t("must_assign_pt"));
      return;
    }
    updateStatus(selectedAppointment._id, "accepted", selectedPT, adminNotes);
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 my-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">
            {t("clinic_appointment_requests")}
          </h2>
          <button
            onClick={() => navigate("/pt/clinic-appointments")}
            className="btn btn-sm p-1 bg-caribbean text-white hover:bg-tufts">
            {t("view_all")}
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>{t("no_appointment_requests")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow p-4 my-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">
            {t("clinic_appointment_requests")}
          </h2>
          <button
            onClick={() => navigate("/pt/clinic-appointments")}
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
                      <div className="font-medium">{appt.requester?.fullName}</div>
                      {appt.requester?.email && (
                        <div className="text-sm text-gray-500">{appt.requester.email}</div>
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
                    {appt.status?.toLowerCase() === "pending" && (
                      <>
                        <button
                          disabled={updatingId === appt._id}
                          onClick={() => openAssignModal(appt)}
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

                    <button
                      onClick={() => navigate(`/clinic/appointments/${appt._id}`)}
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

      {/* Assignment Modal */}
      {showAssignModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{t("accept_appointment")}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("patient")}: {selectedAppointment.requester?.fullName}
                </label>
                <label className="block text-sm font-medium mb-2">
                  {t("date_time")}: {dayjs(selectedAppointment.scheduledAt).format("ddd, DD MMM YYYY HH:mm")}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("assign_physiotherapist")} {t("optional")}
                </label>
                <select
                  value={selectedPT}
                  onChange={(e) => setSelectedPT(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">{t("no_specific_pt")}</option>
                  {availablePTs.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.fullName} {pt.ptProfile?.speciality && `- ${pt.ptProfile.speciality}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("admin_notes")} {t("optional")}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full border rounded p-2"
                  rows={3}
                  placeholder={t("add_notes_placeholder")}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleAcceptAppointment}
                disabled={updatingId === selectedAppointment._id}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {updatingId === selectedAppointment._id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t("confirm_accept")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
