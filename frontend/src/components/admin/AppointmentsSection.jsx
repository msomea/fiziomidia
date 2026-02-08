import { useEffect, useState } from "react";
import API from "../../api/axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { API_URL } from "../../config/constants";
import CollapsibleSection from "./CollapsibleSection";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [clinic, setClinic] = useState("");
  const [pt, setPt] = useState("");
  const [requester, setRequester] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [clinic, pt, requester, status]);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const res = await API.get(`${API_URL}/admin/appointments`, {
        params: {
          search,
          clinic,
          pt,
          requester,
          status,
        },
      });

      setAppointments(res.data.appts || []);
    } catch (error) {
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await API.put(`${API_URL}/admin/appointments/${id}`, { status: newStatus });
      toast.success("Status updated");
      loadAppointments();
    } catch {
      toast.error("Update failed");
    }
  };

  // ✅ DELETE APPOINTMENT
  const deleteAppointment = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirm) return;

    try {
      await API.delete(`${API_URL}/admin/appointments/${id}`);
      toast.success("Appointment deleted");
      loadAppointments();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <CollapsibleSection title="Appointments Management">
      <div className="space-y-4">
        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Clinic Name"
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="PT Name"
            value={pt}
            onChange={(e) => setPt(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Requester Name"
            value={requester}
            onChange={(e) => setRequester(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* RESULTS */}
        <div className="mt-4">
          {loading ? (
            <div className="h-screen flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
              <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 text-sm mt-20">No appointments found</p>
          ) : (
            appointments.map((a) => (
              <div key={a._id} className="border rounded p-3 bg-gray-50 mb-3">
                <Link to={`/admin/appointments/${a._id}`}>
                  <h3 className="font-bold text-caribbean">
                    Appointment #{a._id}
                  </h3>
                </Link>

                <div className="text-sm mt-2 text-tufts">
                  <p>
                    <span className="font-semibold">Clinic:</span>{" "}
                    {a.clinic?.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">PT:</span>{" "}
                    {a.pt?.fullName}
                  </p>
                  <p>
                    <span className="font-semibold">Requester:</span>{" "}
                    {a.requester?.fullName}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span> {a.status}
                  </p>
                  <p>
                    <span className="font-semibold">Requested Date:</span>{" "}
                    {dayjs(a.scheduledDate).format("ddd, DD/MM/YYYY")}
                  </p>
                  <p>
                    <span className="font-semibold">Requested Time:</span>{" "}
                    {a.scheduledTime}
                  </p>
                </div>

                {/* STATUS BUTTONS */}
                <div className="flex gap-2 mt-3">
                  {["accepted", "declined", "cancelled", "completed"].map(
                    (s) => (
                      <button
                        key={s}
                        className="px-3 py-1 text-xs text-white bg-tufts hover:bg-gray-300 rounded"
                        onClick={() => updateStatus(a._id, s)}
                      >
                        Mark {s}
                      </button>
                    )
                  )}
                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => deleteAppointment(a._id)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-800"
                  >
                    Delete Appointment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
