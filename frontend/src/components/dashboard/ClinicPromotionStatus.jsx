import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { 
  Building, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  ExternalLink,
  Plus
} from "lucide-react";

export default function ClinicPromotionStatus() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinicPromotions();
  }, []);

  const fetchClinicPromotions = async () => {
    try {
      // Fetch user's clinics
      const clinicsResponse = await API.get(`${API_URL}/clinics/my-clinics`);
      const userClinics = clinicsResponse.data || [];
      setClinics(userClinics);

      // Fetch user's clinic promotions
      const promotionsResponse = await API.get(`${API_URL}/promotions/clinic/my-promotions`);
      const userPromotions = promotionsResponse.data || [];
      setPromotions(userPromotions);
    } catch (error) {
      console.error("Failed to fetch clinic promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionForClinic = (clinicId) => {
    return promotions.find(promo => promo.clinic._id === clinicId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "expired":
      case "suspended":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "expired":
      case "suspended":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatExpiryDate = (endDate) => {
    if (!endDate) return t("no_expiry_date");
    const expiryDate = new Date(endDate);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return t("expired");
    if (daysLeft === 0) return t("expires_today");
    if (daysLeft === 1) return t("expires_tomorrow");
    
    return t("expires_in_days", { days: daysLeft });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {t("no_clinics_found")}
        </h3>
        <p className="text-gray-600 mb-4">
          {t("need_clinic_to_create_promotion")}
        </p>
        {/* <Link
          to="/clinic/create"
          className="btn bg-caribbean text-white"
        >
          {t("create_first_clinic")}
        </Link> */}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-caribbean flex items-center gap-2">
            <Building className="w-6 h-6" />
            {t("clinic_promotions")}
          </h2>
          <Link
            to="/services/clinic-promotions/create"
            className="btn bg-tufts text-white btn-sm"
          >
            <Plus className="w-4 h-4" />
            {t("create_new_promotion")}
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {clinics.map((clinic) => {
          const promotion = getPromotionForClinic(clinic._id);
          
          return (
            <div key={clinic._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {clinic.name}
                    </h3>
                    {promotion && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promotion.status)}`}>
                        {getStatusIcon(promotion.status)}
                        {t(promotion.status)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {clinic.address}
                  </p>

                  {promotion ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {promotion.title} - {t("tier")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span className={promotion.endAt && new Date(promotion.endAt) < new Date() ? "text-red-600" : "text-gray-600"}>
                          {formatExpiryDate(promotion.endAt)}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Link
                          to={`/clinic/promotions/manage/${promotion._id}`}
                          className="btn btn-sm bg-caribbean text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t("manage_promotion")}
                        </Link>
                        
                        {promotion.status !== "active" && (
                          <Link
                            to="/services/clinic-promotions/create"
                            state={{ clinicId: clinic._id }}
                            className="btn btn-sm bg-tufts text-white"
                          >
                            <Plus className="w-3 h-3" />
                            {t("extend_promotion")}
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">
                        {t("no_active_promotion")}
                      </p>
                      <Link
                        to="/services/clinic-promotions/create"
                        state={{ clinicId: clinic._id }}
                        className="btn bg-tufts text-white btn-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {t("create_promotion")}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
