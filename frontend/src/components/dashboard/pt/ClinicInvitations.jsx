import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Building, MapPin, Phone, CheckCircle, XCircle, Clock, ExternalLink, User } from "lucide-react";
import { Link } from "react-router";
import { getMyPTRequests, respondToPTRequest } from "../../../api/clinics";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const ClinicInvitations = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const requests = await getMyPTRequests();
      setInvitations(requests);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error(t("failed_to_load_invitations"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvitations();
    }
  }, [isOpen]);

  const handleResponse = async (requestId, action) => {
    try {
      await respondToPTRequest(requestId, action);
      toast.success(t(`invitation_${action}`));
      
      // Update the local state to reflect the change
      setInvitations(prev => 
        prev.map(inv => 
          inv._id === requestId 
            ? { ...inv, status: action }
            : inv
        )
      );
    } catch (error) {
      console.error(`Error ${action} invitation:`, error);
      toast.error(t(`failed_to_${action}_invitation`));
    }
  };

  // Filter invitations by status
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');

  // Render
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-caribbean" />
          <h3 className="text-lg font-semibold text-gray-800">
            {t("clinic_invitations")}
          </h3>
          {pendingInvitations.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {pendingInvitations.length}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-caribbean mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">{t("loading")}</p>
            </div>
          ) : (
            <>
              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    {t("pending_invitations")}
                  </h4>
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation._id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Link to={`/clinic/${invitation.clinicId._id}`}>
                              <h5 className="font-medium text-caribbean mb-1">
                              {invitation.clinicId?.name || t("clinic_name_unavailable")}
                            </h5>
                            </Link>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin size={14} />
                                <span>{invitation.clinicId?.address || t("address_unavailable")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User size={14} />
                                <span>{invitation.requestedBy?.fullName || t("name_unavailable")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={14} />
                                <span>{invitation.requestedBy?.phone || t("phone_unavailable")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>{new Date(invitation.requestedAt).toLocaleDateString()}</span>
                              </div>
                              {invitation.message && (
                                <p className="text-xs text-gray-500 italic mt-2">
                                  "{invitation.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleResponse(invitation._id, 'accepted')}
                              className="text-green-500 hover:text-green-700 p-1"
                              title={t("accept")}
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleResponse(invitation._id, 'rejected')}
                              className="text-red-500 hover:text-red-700 p-1"
                              title={t("reject")}
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Clinics */}
              {acceptedInvitations.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    {t("accepted_clinics")}
                  </h4>
                  <div className="space-y-3">
                    {acceptedInvitations.map((invitation) => (
                      <div key={invitation._id} className="border border-green-200 bg-green-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-800">
                                {invitation.clinicId?.name || t("clinic_name_unavailable")}
                              </h5>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin size={14} />
                                <span>{invitation.clinicId?.address || t("address_unavailable")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={14} />
                                <span>{invitation.clinicId?.contactPhone || t("phone_unavailable")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>{t("accepted_on")}: {new Date(invitation.respondedAt).toLocaleDateString()}</span>
                              </div>
                              {invitation.clinicId?.services && invitation.clinicId.services.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {invitation.clinicId.services.slice(0, 3).map((service, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      {service}
                                    </span>
                                  ))}
                                  {invitation.clinicId.services.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{invitation.clinicId.services.length - 3} {t("more")}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Link
                            to={`/clinic/${invitation.clinicId?._id}`}
                            className="text-caribbean hover:text-caribbean/80 p-1"
                            title={t("view_clinic_details")}
                          >
                            <ExternalLink size={18} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No invitations */}
              {invitations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{t("no_clinic_invitations")}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicInvitations;
