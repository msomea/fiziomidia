import React, { useState } from "react";
import { useNavigate } from "react-router";
import { requestClinicAppointment } from "../../api/clinicAppointments";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  User
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ClinicAppointmentForm = ({ 
  clinicId, 
  physiotherapists = [], 
  onSuccess, 
  onCancel,
  className = "" 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedPT, setSelectedPT] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-select first PT if available (but don't auto-select, let user choose)
  React.useEffect(() => {
    // Removed auto-selection to make PT truly optional
  }, [physiotherapists, selectedPT]);

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
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate based on user role
        if (user.role === "physiotherapist") {
          navigate(`/dashboard/pt/${user._id}`);
        } else {
          navigate(`/dashboard/member/${user._id}`);
        }
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

  if (physiotherapists.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-gray-600">{t("no_physiotherapists_available")}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Available Physiotherapists */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          {t("available_physiotherapists")} {t("optional")}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          {t("select_pt_optional_message")}
        </p>
        
        <div className="space-y-3">
          {/* Option for no specific PT */}
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
          {physiotherapists.map((pt) => (
            <label
              key={pt._id}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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

        <div className="flex space-x-3">
          <button
            type="submit"
            className={`flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex justify-center items-center transition-colors ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {t("book_appointment")}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("cancel")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ClinicAppointmentForm;
