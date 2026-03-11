import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Phone, Building, ChevronDown, X } from "lucide-react";
import { getClinics, createClinic, updateClinic, deleteClinic, getPTClinics } from "../../api/clinics";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const ClinicManagement = ({ formData, setFormData, user, t }) => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    contactPhone: "",
    coordinates: [0, 0], // [longitude, latitude]
    services: [],
    physiotherapists: []
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const data = await getPTClinics(user._id);
      const ptClinics = data;
      setClinics(ptClinics);
      
      // Update formData with clinic IDs (this will be saved when profile is saved)
      setFormData(prev => ({
        ...prev,
        clinicIds: ptClinics.map(clinic => clinic._id)
      }));
    } catch (error) {
      console.error("Error fetching clinics:", error);
      toast.error(t("failed_to_load_clinics"));
    }
  };

  const handleNewClinicChange = (e) => {
    const { name, value } = e.target;
    setClinicForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validate form
    if (!clinicForm.name || !clinicForm.address || !clinicForm.contactPhone) {
      toast.error(t("fill_all_fields"));
      return;
    }

    // Validate coordinates
    if (!clinicForm.coordinates || clinicForm.coordinates.length !== 2) {
      toast.error("Please provide valid coordinates");
      return;
    }

    setLoading(true);

    try {
      const clinicData = {
        name: clinicForm.name,
        address: clinicForm.address,
        contactPhone: clinicForm.contactPhone,
        location: {
          type: "Point",
          coordinates: clinicForm.coordinates // [longitude, latitude]
        },
        ownerUserId: user._id,
        services: clinicForm.services,
        physiotherapists: clinicForm.physiotherapists
      };

      if (editingClinic) {
        await updateClinic(editingClinic._id, clinicData);
        toast.success(t("clinic_updated"));
      } else {
        await createClinic(clinicData);
        toast.success(t("clinic_added"));
      }

      setClinicForm({ 
        name: "", 
        address: "", 
        contactPhone: "", 
        coordinates: [0, 0], 
        services: [], 
        physiotherapists: [] 
      });
      setShowAddForm(false);
      setEditingClinic(null);
      
      // Refresh clinics and update formData.clinicIds
      await fetchClinics();
      
      // Trigger global event to notify other components (dashboard, profile)
      window.dispatchEvent(new Event("clinicsUpdated"));
    } catch (error) {
      console.error("Error saving clinic:", error);
      toast.error(t("failed_to_save_clinic"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic) => {
    setEditingClinic(clinic);
    setClinicForm({
      name: clinic.name,
      address: clinic.address,
      contactPhone: clinic.contactPhone,
      coordinates: clinic.location?.coordinates || [0, 0],
      services: clinic.services || [],
      physiotherapists: clinic.physiotherapists || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (clinicId) => {
    if (!confirm(t("confirm_delete_clinic"))) return;

    try {
      await deleteClinic(clinicId);
      toast.success(t("clinic_deleted"));
      
      // Refresh clinics and update formData.clinicIds
      await fetchClinics();
      
      // Trigger global event to notify other components (dashboard, profile)
      window.dispatchEvent(new Event("clinicsUpdated"));
    } catch (error) {
      console.error("Error deleting clinic:", error);
      toast.error(t("failed_to_delete_clinic"));
    }
  };

  const handleCancel = () => {
    setClinicForm({ 
      name: "", 
      address: "", 
      contactPhone: "", 
      coordinates: [0, 0], 
      services: [], 
      physiotherapists: [] 
    });
    setShowAddForm(false);
    setEditingClinic(null);
  };

  return (
    <div className="card bg-white shadow-md p-6">
      {/* HEADER */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean flex items-center gap-2">
          <Building className="w-5 h-5" />
          {t("clinic_management")}
        </h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* COLLAPSIBLE BODY */}
      {isOpen && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">{t("manage_clinics")}</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-tufts transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("add_clinic")}
            </button>
          </div>

          {/* Clinics List */}
          <div className="space-y-4 mb-6">
            {clinics.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_clinics_added")}</p>
            ) : (
              clinics.map((clinic) => (
                <div key={clinic._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
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
                            📍 {clinic.location.coordinates[1]}, {clinic.location.coordinates[0]}
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
                            👥 {clinic.physiotherapists.length} {t("physiotherapists")}
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
                            👤 {t("owner")}: {clinic.ownerUserId.fullName || clinic.ownerUserId.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(clinic)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(clinic._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add/Edit Clinic Form */}
          {showAddForm && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-800 mb-4">
                {editingClinic ? t("edit_clinic") : t("add_new_clinic")}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("clinic_name")}
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicForm.name}
                    onChange={(e) => setClinicForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input input-bordered w-full text-sm"
                    placeholder={t("enter_clinic_name")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("clinic_address")}
                  </label>
                  <textarea
                    required
                    value={clinicForm.address}
                    onChange={(e) => setClinicForm(prev => ({ ...prev, address: e.target.value }))}
                    className="input input-bordered w-full text-sm"
                    rows={3}
                    placeholder={t("enter_clinic_address")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("contact_phone")}
                  </label>
                  <input
                    type="tel"
                    required
                    value={clinicForm.contactPhone}
                    onChange={(e) => setClinicForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="input input-bordered w-full text-sm"
                    placeholder={t("enter_contact_phone")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("longitude")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={clinicForm.coordinates[0]}
                      onChange={(e) => setClinicForm(prev => ({
                        ...prev,
                        coordinates: [parseFloat(e.target.value) || 0, prev.coordinates[1]]
                      }))}
                      className="input input-bordered w-full text-sm"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("latitude")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={clinicForm.coordinates[1]}
                      onChange={(e) => setClinicForm(prev => ({
                        ...prev,
                        coordinates: [prev.coordinates[0], parseFloat(e.target.value) || 0]
                      }))}
                      className="input input-bordered w-full text-sm"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("services")}
                  </label>
                  <input
                    type="text"
                    value={clinicForm.services.join(", ")}
                    onChange={(e) => setClinicForm(prev => ({
                      ...prev,
                      services: e.target.value.split(",").map(s => s.trim()).filter(s => s)
                    }))}
                    className="input input-bordered w-full text-sm"
                    placeholder={t("enter_services_comma_separated")}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("comma_separated_values")}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn bg-caribbean text-white hover:bg-tufts flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? t("saving") : (editingClinic ? t("update") : t("add"))}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicManagement;
