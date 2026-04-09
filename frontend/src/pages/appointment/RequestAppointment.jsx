// src/pages/appointments/BookAppointment.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { requestAppointment } from "../../api/appointments";
import { fetchPTById } from "../../api/pts";
import { getClinicsPTWork} from "../../api/clinics";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BookAppointment() {
  const { t } = useTranslation();
  const { ptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pt, setPt] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ptData, clinicsData] = await Promise.all([
          fetchPTById(ptId),
          getClinicsPTWork(ptId)
        ]);
        setPt(ptData);
        setClinics(clinicsData);
        
        // Auto-select first clinic if available
        if (clinicsData.length > 0) {
          setSelectedClinic(clinicsData[0]._id);
        }
      } catch (error) {
        console.error(error);
        toast.error(t("failed_load_pt"));
      }
    };
    loadData();
  }, [ptId, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !time) {
      return toast.error(t("select_date_time"));
    }

    if (clinics.length > 0 && !selectedClinic) {
      return toast.error(t("select_clinic"));
    }

    setLoading(true);
    try {
      await requestAppointment({
        pt: ptId,
        clinic: selectedClinic,
        date,
        time,
        notes,
      });

      toast.success(t("appointment_booked_success"));
      navigate(`/dashboard/member/${user._id}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || t("failed_book_appointment")
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

  
  return (
    <div className="max-w-lg mx-auto p-6 bg-white text-tufts rounded-lg shadow-md mt-20">
      <h2 className="text-2xl text-caribbean font-semibold mb-4">
        {t("book_appointment_with", { name: pt.fullName })}
      </h2>

      <p className="mb-6 text-gray-600">{pt.specialization}</p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {clinics.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">
              {t("select_clinic")}
            </label>
            <select
              className="w-full border p-2 rounded"
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              required
            >
              <option value="">{t("choose_clinic")}</option>
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name} - {clinic.address}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block mb-1 font-medium">
            {t("select_date")}
          </label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            {t("select_time")}
          </label>
          <input
            type="time"
            className="w-full border p-2 rounded"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            {t("notes_optional")}
          </label>
          <textarea
            className="w-full border p-2 rounded"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("additional_info_placeholder")}
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
          {t("book_appointment")}
        </button>
      </form>
    </div>
  );
}
