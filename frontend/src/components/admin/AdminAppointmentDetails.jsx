import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next'
import { fetchAppointmentById, updateAppointmentStatus } from "../../api/appointments";
import toast from "react-hot-toast";

export default function AdminAppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    status: "",
    date: "",
    time: "",
    physiotherapist: "",
    adminNotes: "",
  });
  const { t } = useTranslation()

  const fetchDetails = async () => {
    try {
      const data = await fetchAppointmentById(id);

      if (!data.appointment) throw new Error();

      setAppointment(data.appointment);

      setForm({
        status: data.appointment.status,
        date: data.appointment.scheduledDate || "",
        time: data.appointment.scheduledTime || "",
        physiotherapist: data.appointment.pt?._id || "",
        adminNotes: data.appointment.adminNotes || "",
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching appointment details:", err);
      toast.error(t('failed_load_appointment'));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateAppointmentStatus(id, form.status, null, form.date, form.time);

      toast.success(t('appointment_updated'));
    } catch (err) {
      console.error("Error updating appointment:", err);
      toast.error(t('failed_update_appointment'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
          <p className="mt-4 text-caribbean font-medium animate-pulse">{t('loading_appointment')}</p>
        </div>
    );
  }

  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 text-tufts">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-caribbean">{t('manage_appointment')}</h3>
        <button onClick={() => navigate(-1)}><X className="text-red-400 hover:text-red-800"/></button>
      </div>

      {/* STATUS */}
      <label>{t('label_status')}</label>
      <select
        className="border p-2 rounded w-full"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
      >
        <option value="pending">{t('status_pending')}</option>
        <option value="accepted">{t('status_accepted')}</option>
        <option value="declined">{t('status_declined')}</option>
        <option value="cancelled">{t('status_cancelled')}</option>
        <option value="completed">{t('status_completed')}</option>
      </select>

      {/* DATE */}
      <label className="block mt-3">{t('label_date')}</label>
      <input
        type="date"
        className="border p-2 rounded w-full"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      {/* TIME */}
      <label className="block mt-3">{t('label_time')}</label>
      <input
        type="time"
        className="border p-2 rounded w-full"
        value={form.time}
        onChange={(e) => setForm({ ...form, time: e.target.value })}
      />

      {/* PT */}
      <label className="block mt-3">{t('assign_physiotherapist')}</label>
      <input
        className="border p-2 rounded w-full"
        value={form.physiotherapist}
        onChange={(e) =>
          setForm({ ...form, physiotherapist: e.target.value })
        }
      />

      {/* NOTES */}
      <label className="block mt-3">{t('admin_notes')}</label>
      <textarea
        className="border p-2 rounded w-full"
        rows={3}
        value={form.adminNotes}
        onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 bg-caribbean text-white px-4 py-2 rounded shadow hover:bg-tufts"
      >
        {saving ? t('saving') : t('save')}
      </button>
    </div>
  );
}
