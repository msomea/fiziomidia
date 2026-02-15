// src/pages/appointments/BookAppointment.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { requestAppointment } from "../../api/appointments";

export default function BookAppointment() {
  const { ptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pt, setPt] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch PT details
  useEffect(() => {
    const fetchPt = async () => {
      try {
        const res = await API.get(`/pts/${ptId}`);
        setPt(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load physiotherapist details");
      }
    };
    fetchPt();
  }, [ptId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      return toast.error("Please select both date and time");
    }

    setLoading(true);
    try {
      await API.post("/appointments", {
        pt: ptId,
        member: user._id,
        date,
        time,
        notes,
      });
      toast.success("Appointment booked successfully");
      navigate(`/dashboard/member/${user._id}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to book appointment"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!pt) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }
console.log(pt)
  return (
    <div className="max-w-lg mx-auto p-6 bg-white text-tufts rounded-lg shadow-md mt-20">
      <h2 className="text-2xl text-caribbean font-semibold mb-4">
        Book Appointment with {pt.fullName}
      </h2>
      <p className="mb-6 text-gray-600">{pt.specialization}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Select Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]} // can't book past
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Select Time</label>
          <input
            type="time"
            className="w-full border p-2 rounded"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Notes (Optional)</label>
          <textarea
            className="w-full border p-2 rounded"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional info..."
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex justify-center items-center ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : null}
          Book Appointment
        </button>
      </form>
    </div>
  );
}
