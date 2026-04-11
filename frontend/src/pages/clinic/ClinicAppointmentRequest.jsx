import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { requestClinicAppointment, getClinicAvailablePTs } from "../../api/clinicAppointments";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  ChevronLeft,
  Phone
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ClinicAppointmentRequest = () => {
  const { t } = useTranslation();
  const { clinicId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clinic, setClinic] = useState(null);
  const [availablePTs, setAvailablePTs] = useState([]);
  const [selectedPT, setSelectedPT] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [clinicLoading, setClinicLoading] = useState(true);

  useEffect(() => {
    fetchClinicData();
  }, [clinicId]);

  const fetchClinicData = async () => {
    try {
      setClinicLoading(true);
      const data = await getClinicAvailablePTs(clinicId);
      setClinic(data.clinic);
      setAvailablePTs(data.availablePTs || []);
      
      // Auto-select first PT if available
      if (data.availablePTs && data.availablePTs.length > 0) {
        setSelectedPT(data.availablePTs[0]._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("failed_load_clinic"));
    } finally {
      setClinicLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !time) {
      return toast.error(t("select_date_time"));
    }

    setLoading(true);
    try {
      await requestClinicAppointment({
        clinic: clinicId,
        pt: selectedPT || undefined, // Send undefined if no PT selected
        date,
        time,
        notes,
      });

      toast.success(t("appointment_booked_success"));
      // Navigate based on user role
      if (user.role === "physiotherapist") {
        navigate(`/dashboard/pt/${user._id}`);
      } else {
        navigate(`/dashboard/member/${user._id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || t("failed_book_appointment")
      );
    } finally {
      setLoading(false);
    }
  };

  if (clinicLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t("clinic_not_found")}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800"
          >
            {t("go_back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white text-tufts rounded-lg shadow-md mt-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ChevronLeft size={20} className="mr-1" />
          {t("back")}
        </button>
        
        <h1 className="text-3xl text-caribbean font-semibold mb-2">
          {t("request_appointment_at")}
        </h1>
        
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <h2 className="text-2xl text-gray-800 font-medium">{clinic.name}</h2>
            <div className="flex items-center text-gray-600 mt-2">
              <MapPin size={16} className="mr-2" />
              <span>{clinic.address}</span>
            </div>
            {clinic.contactPhone && (
              <div className="flex items-center text-gray-600 mt-1">
                <Phone size={16} className="mr-2" />
                <span>{clinic.contactPhone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Physiotherapists */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          {t("available_pts")} {t("optional")}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          {t("select_pt_optional_message")}
        </p>
        
        {availablePTs.length === 0 ? (
          <div>
            <p className="text-gray-600 mb-3">{t("no_physiotherapists_available")}</p>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
              <input
                type="radio"
                name="physiotherapist"
                value=""
                checked={!selectedPT}
                onChange={() => setSelectedPT("")}
                className="mr-3"
              />
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full mr-3 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{t("no_specific_pt")}</p>
                  <p className="text-sm text-gray-600">{t("clinic_will_assign_pt")}</p>
                </div>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Option for no specific PT */}
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
              <input
                type="radio"
                name="physiotherapist"
                value=""
                checked={!selectedPT}
                onChange={() => setSelectedPT("")}
                className="mr-3"
              />
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full mr-3 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{t("no_specific_pt")}</p>
                  <p className="text-sm text-gray-600">{t("clinic_will_assign_pt")}</p>
                </div>
              </div>
            </label>
            
            {/* Available PTs */}
            {availablePTs.map((pt) => (
              <label
                key={pt._id}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors"
              >
                <input
                  type="radio"
                  name="physiotherapist"
                  value={pt._id}
                  checked={selectedPT === pt._id}
                  onChange={(e) => setSelectedPT(e.target.value)}
                  className="mr-3"
                />
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{pt.fullName}</p>
                    {pt.ptProfile?.speciality && (
                      <p className="text-sm text-gray-600">{pt.ptProfile.speciality}</p>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              <Calendar size={16} className="inline mr-1" />
              {t("select_date")}
            </label>
            <input
              type="date"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              <Clock size={16} className="inline mr-1" />
              {t("select_time")}
            </label>
            <input
              type="time"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            {t("notes_optional")}
          </label>
          <textarea
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("additional_info_placeholder")}
            rows={4}
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex justify-center items-center transition-colors ${
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
};

export default ClinicAppointmentRequest;
