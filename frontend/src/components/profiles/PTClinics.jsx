import React, { useState, useEffect } from "react";
import { Building, MapPin, Phone, ChevronDown } from "lucide-react";
import { getPTClinics } from "../../api/clinics";
import { useTranslation } from "react-i18next";

const PTClinics = ({ clinicIds, ptId }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinics();
    
    // Listen for clinic updates from other components
    const handleClinicsUpdated = () => {
      fetchClinics();
    };
    
    window.addEventListener("clinicsUpdated", handleClinicsUpdated);
    
    return () => {
      window.removeEventListener("clinicsUpdated", handleClinicsUpdated);
    };
  }, [clinicIds]);

  const fetchClinics = async () => {
    try {
      if (!clinicIds || clinicIds.length === 0) {
        setClinics([]);
        setLoading(false);
        return;
      }
      const data = await getPTClinics(ptId);
      setClinics(data);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean flex items-center gap-2">
          <Building className="w-5 h-5" />
          {t("clinics")}
        </h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ) : clinics.length === 0 ? (
            <p className="text-gray-700 text-sm md:text-base">{t("no_clinics_available")}</p>
          ) : (
            <div className="space-y-4">
              {clinics.map((clinic) => (
                <div key={clinic._id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2">{clinic.name}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{clinic.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{clinic.contactPhone}</span>
                        </div>
                        {clinic.location?.coordinates && (
                          <div className="text-xs text-gray-500">
                            {clinic.location.coordinates[1]}, {clinic.location.coordinates[0]}
                          </div>
                        )}
                        {clinic.services && clinic.services.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-700">{t("services")}: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {clinic.services.map((service, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {clinic.physiotherapists && clinic.physiotherapists.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {clinic.physiotherapists.length} {t("physiotherapists")}
                            <div className="ml-4">
                              {clinic.physiotherapists.map((pt, idx) => (
                                <span key={idx} className="block">
                                  • {pt.fullName || pt.email}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {clinic.ownerUserId && (
                          <div className="text-xs text-gray-500">
                            {t("owner")}: {clinic.ownerUserId.fullName || clinic.ownerUserId.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PTClinics;
