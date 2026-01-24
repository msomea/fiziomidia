import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { X, Loader2 } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";

export default function AdminAppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  const [form, setForm] = useState({
    status: "",
    date: "",
    time: "",
    physiotherapist: "",
    adminNotes: "",
  });

  const fetchDetails = async () => {
    try {
      const res = await API.get(`/admin/appointments/${id}`);
      const data = res.data;

      if (!data.success) throw new Error();

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
      toast.error("Failed to load appointment");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSave = async () => {
    try {
      const res = await API.put(`/admin/appointments/${id}`, {
        status: form.status,
        date: form.date,
        time: form.time,
        physiotherapist: form.physiotherapist,
        adminNotes: form.adminNotes,
      });

      if (!res.data.success) throw new Error();

      toast.success("Appointment updated");
    } catch (err) {
      console.error("Error updating appointment:", err);
      toast.error("Failed to update appointment");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Appointment...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 text-tufts">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-caribbean">Manage Appointment</h3>
        <button onClick={() => navigate(-1)}><X className="text-red-400 hover:text-red-800"/></button>
      </div>

      {/* STATUS */}
      <label>Status</label>
      <select
        className="border p-2 rounded w-full"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
      >
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="declined">Declined</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>

      {/* DATE */}
      <label className="block mt-3">Date</label>
      <input
        type="date"
        className="border p-2 rounded w-full"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      {/* TIME */}
      <label className="block mt-3">Time</label>
      <input
        type="time"
        className="border p-2 rounded w-full"
        value={form.time}
        onChange={(e) => setForm({ ...form, time: e.target.value })}
      />

      {/* PT */}
      <label className="block mt-3">Assign Physiotherapist (ID)</label>
      <input
        className="border p-2 rounded w-full"
        value={form.physiotherapist}
        onChange={(e) =>
          setForm({ ...form, physiotherapist: e.target.value })
        }
      />

      {/* NOTES */}
      <label className="block mt-3">Admin Notes</label>
      <textarea
        className="border p-2 rounded w-full"
        rows={3}
        value={form.adminNotes}
        onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
      />

      <button
        onClick={handleSave}
        className="mt-4 bg-caribbean text-white px-4 py-2 rounded shadow"
      >
        Save
      </button>
    </div>
  );
}
