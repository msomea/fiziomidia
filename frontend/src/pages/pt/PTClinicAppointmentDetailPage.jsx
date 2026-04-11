import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getClinicAppointmentById, updateClinicAppointmentStatus, getClinicPTsForAssignment } from "../../api/clinicAppointments";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export default function PTClinicAppointmentDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availablePTs, setAvailablePTs] = useState([]);
  const [selectedPT, setSelectedPT] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const data = await getClinicAppointmentById(id);
        setAppointment(data.appointment);
        setSelectedPT(data.appointment.pt?._id || "");
        setAdminNotes(data.appointment.adminNotes || "");
      } catch (err) {
        toast.error(t("failed_load_appointment"));
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, t, navigate]);

  const fetchAvailablePTs = async () => {
    if (!appointment?.clinic?._id) return;
    
    try {
      const response = await getClinicPTsForAssignment(appointment.clinic._id);
      setAvailablePTs(response.pts);
    } catch (error) {
      console.error("Failed to fetch available PTs:", error);
      toast.error(t("failed_load_pts"));
    }
  };

  const openAssignModal = async () => {
    await fetchAvailablePTs();
    setShowAssignModal(true);
  };

  const updateStatus = async (status, assignedPT = null, notes = null) => {
    try {
      setUpdating(true);

      const updateData = { status };
      if (assignedPT) updateData.assignedPT = assignedPT;
      if (notes) updateData.notes = notes;

      const response = await updateClinicAppointmentStatus(id, updateData);
      
      setAppointment((prev) => ({ 
        ...prev, 
        status,
        pt: response.appointment?.pt || prev.pt,
        adminNotes: response.appointment?.adminNotes || prev.adminNotes
      }));
      
      toast.success(t("status_updated"));
      setShowAssignModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("failed_update_status"));
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptAppointment = () => {
    if (!selectedPT && !appointment.pt) {
      toast.error(t("must_assign_pt"));
      return;
    }
    updateStatus("accepted", selectedPT, adminNotes);
  };

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
          {t("manage_clinic_appointment")}
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
            <p className="text-sm text-gray-600">{appointment.requester?.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("clinic")}</p>
            <p className="font-medium">{appointment.clinic?.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("scheduled_at")}</p>
            <p className="font-medium">
              {dayjs(appointment.scheduledAt || `${appointment.scheduledDate}T${appointment.scheduledTime}`).format(
                "DD MMM YYYY • HH:mm"
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("assigned_pt")}</p>
            <p className="font-medium">
              {appointment.pt?.fullName || t("no_specific_pt")}
            </p>
            {appointment.pt?.ptProfile?.speciality && (
              <p className="text-sm text-gray-600">{appointment.pt.ptProfile.speciality}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("status")}</p>
            <p className={`font-semibold capitalize ${getStatusClass(appointment.status)}`}>
              {t(`status_${appointment.status?.toLowerCase()}`)}
            </p>
          </div>

          {appointment.adminNotes && (
            <div>
              <p className="text-sm text-gray-500">{t("admin_notes")}</p>
              <p className="font-medium">{appointment.adminNotes}</p>
            </div>
          )}

          {appointment.createdAt && (
            <div>
              <p className="text-sm text-gray-500">{t("requested_on")}</p>
              <p className="font-medium">
                {dayjs(appointment.createdAt).format("DD MMM YYYY • HH:mm")}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">

          {appointment.status === "pending" && (
            <>
              <button
                disabled={updating}
                onClick={openAssignModal}
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
            <>
              <button
                disabled={updating}
                onClick={openAssignModal}
                className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition disabled:opacity-50"
              >
                {t("reassign_pt")}
              </button>

              <button
                disabled={updating}
                onClick={() => updateStatus("cancelled")}
                className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50"
              >
                {t("cancel")}
              </button>
            </>
          )}

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-lg bg-gray-400 hover:bg-gray-700 font-medium transition"
          >
            {t("back")}
          </button>

        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 text-tufts bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {appointment.status === "accepted" ? t("reassign_pt") : t("accept_appointment")}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("patient")}: {appointment.requester?.fullName}
                </label>
                <label className="block text-sm font-medium mb-2">
                  {t("date_time")}: {dayjs(appointment.scheduledAt || `${appointment.scheduledDate}T${appointment.scheduledTime}`).format("ddd, DD MMM YYYY HH:mm")}
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
                disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  appointment.status === "accepted" ? t("update") : t("confirm_accept")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
