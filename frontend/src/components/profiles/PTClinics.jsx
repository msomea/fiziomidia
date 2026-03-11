import React, { useState, useEffect } from "react";
import { Building, MapPin, Phone, Globe, Users, Star, ChevronDown, ExternalLink } from "lucide-react";
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
          {t("clinics")} ({clinics.length})
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
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="h-5 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : clinics.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm md:text-base">{t("no_clinics_available")}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {clinics.map((clinic) => (
                <div key={clinic._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-caribbean/30 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-caribbean to-tufts rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg group-hover:text-caribbean transition-colors">
                            {clinic.name}
                          </h3>
                          {clinic.rating?.average && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{clinic.rating.average.toFixed(1)}</span>
                              <span className="text-gray-500">({clinic.rating.count})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {clinic.rating?.average && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                          <Star className="w-4 h-4 fill-current" />
                          {clinic.rating.average.toFixed(1)}
                        </div>
                        <p className="text-xs text-gray-500">{clinic.rating.count} {t("reviews")}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{clinic.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{clinic.contactPhone}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {clinic.location?.coordinates && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{clinic.location.coordinates[1].toFixed(4)}, {clinic.location.coordinates[0].toFixed(4)}</span>
                        </div>
                      )}
                      {clinic.physiotherapists && clinic.physiotherapists.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{clinic.physiotherapists.length} {t("physiotherapists")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {clinic.services && clinic.services.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">{t("services")}:</p>
                      <div className="flex flex-wrap gap-1">
                        {clinic.services.map((service, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs rounded-full border border-blue-200 hover:border-blue-300 transition-colors"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {clinic.ownerUserId && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <Building className="w-3 h-3 text-gray-600" />
                          </div>
                          <span>{t("owner")}: {clinic.ownerUserId.fullName || clinic.ownerUserId.email}</span>
                        </div>
                        <button className="text-caribbean hover:text-tufts text-xs font-medium flex items-center gap-1 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          {t("view_details")}
                        </button>
                      </div>
                    </div>
                  )}
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
