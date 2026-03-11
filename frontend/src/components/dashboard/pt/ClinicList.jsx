import React, { useState, useEffect } from "react";
import { Building, MapPin, Phone, Plus } from "lucide-react";
import { getPTClinics } from "../../../api/clinics";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const ClinicList = ({ clinics, clinicIds, ptId, viewMore }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clinicsState, setClinicsState] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If clinics are provided directly, use them
    if (clinics) {
      setClinicsState(clinics);
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch clinics by clinicIds (legacy mode)
    fetchClinics();
    
    // Listen for clinic updates from other components
    const handleClinicsUpdated = () => {
      fetchClinics();
    };
    
    window.addEventListener("clinicsUpdated", handleClinicsUpdated);
    
    return () => {
      window.removeEventListener("clinicsUpdated", handleClinicsUpdated);
    };
  }, [clinics, clinicIds]);

  const fetchClinics = async () => {
    try {
      if (!clinicIds || clinicIds.length === 0) {
        setClinicsState([]);
        setLoading(false);
        return;
      }
      
      // Get all clinics and filter by IDs
      const data = await getPTClinics(ptId);
      setClinicsState(data);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-4 m-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 m-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Building className="w-5 h-5" />
          {t("my_clinics")}
        </h2>
        {clinicsState.length > 0 && viewMore && (
          <button
            onClick={() => navigate(viewMore)}
            className="btn btn-sm p-1 bg-caribbean text-white hover:bg-tufts"
          >
            {t("view_all")}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="table table-auto w-full">
          <thead>
            <tr className="bg-alice text-caribbean">
              <th>{t("clinic_name")}</th>
              <th>{t("address")}</th>
              <th>{t("contact")}</th>
              <th>{t("services")}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {clinicsState.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  {t("no_clinics_found")}
                </td>
              </tr>
            ) : (
              clinicsState.slice(0, 3).map((clinic) => (
                <tr key={clinic._id}>
                  <td className="font-medium">{clinic.name}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{clinic.address}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{clinic.contactPhone}</span>
                    </div>
                  </td>
                  <td>
                    {clinic.services && clinic.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {clinic.services.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {service}
                          </span>
                        ))}
                        {clinic.services.length > 2 && (
                          <span className="text-xs text-gray-500">+{clinic.services.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{t("no_services")}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClinicList;
