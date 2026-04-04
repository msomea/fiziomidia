import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Phone, Building, ChevronDown, X } from "lucide-react";
import { createClinic, updateClinic, deleteClinic, getUserClinics } from "../../api/clinics";
import toast from "react-hot-toast";
import LocationSelector from "../location/LocationSelector";

const ClinicManagement = ({ user, t }) => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [serviceInput, setServiceInput] = useState("");

  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    contactPhone: "",
    coordinates: [0, 0],
    services: [],
    physiotherapists: [],
    // Location data
    region: "",
    district: "",
    ward: "",
    street: "",
  });

  const [location, setLocation] = useState({
    region: "",
    district: "",
    ward: "",
    street: "",
  });

  useEffect(() => {
    fetchClinics();
  }, [user]);

  const fetchClinics = async () => {
    try {
      const data = await getUserClinics(user._id);
      setClinics(data);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      toast.error(t("failed_to_load_clinics"));
    }
  };

  const handleLocationSelect = (locationData) => {
    setLocation(locationData);
    
    // Update the address field to include the selected location
    const fullAddress = [
      locationData.street,
      locationData.ward,
      locationData.district,
      locationData.region
    ].filter(Boolean).join(", ");
    
    setClinicForm(prev => ({
      ...prev,
      address: fullAddress,
      region: locationData.region,
      district: locationData.district,
      ward: locationData.ward,
      street: locationData.street,
    }));
  };

  /* ---------------------- SERVICE INPUT ---------------------- */

  const addService = () => {
    const value = serviceInput.trim();
    if (!value) return;

    if (clinicForm.services.includes(value)) {
      toast.error(t("service_already_added"));
      return;
    }

    setClinicForm(prev => ({
      ...prev,
      services: [...prev.services, value]
    }));

    setServiceInput("");
  };

  const removeService = (index) => {
    setClinicForm(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleServiceKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addService();
    }
  };

  /* ---------------------- FORM SUBMIT ---------------------- */

  const handleSubmit = async () => {
    if (!clinicForm.name || !clinicForm.address || !clinicForm.contactPhone) {
      toast.error(t("fill_all_fields"));
      return;
    }

    // Validate location selection
    if (!location.region || !location.district) {
      toast.error(t("please_select_region_and_district"));
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
          coordinates: clinicForm.coordinates
        },
        ownerUserId: user._id,
        services: clinicForm.services,
        physiotherapists: clinicForm.physiotherapists,
        // Add location data for backend
        region: location.region,
        district: location.district,
        ward: location.ward,
        street: location.street,
      };

      if (editingClinic) {
        await updateClinic(editingClinic._id, clinicData);
        toast.success(t("clinic_updated"));
      } else {
        await createClinic(clinicData);
        toast.success(t("clinic_added"));
      }

      resetForm();
      await fetchClinics();

    } catch (error) {
      console.error("Error saving clinic:", error);
      toast.error(error.response?.data?.message || t("failed_to_save_clinic"));
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- EDIT CLINIC ---------------------- */

  const handleEdit = (clinic) => {
    setEditingClinic(clinic);

    setClinicForm({
      name: clinic.name,
      address: clinic.address,
      contactPhone: clinic.contactPhone,
      coordinates: clinic.location?.coordinates || [0, 0],
      services: clinic.services || [],
      physiotherapists: clinic.physiotherapists || [],
      region: clinic.region || "",
      district: clinic.district || "",
      ward: clinic.ward || "",
      street: clinic.street || "",
    });

    setLocation({
      region: clinic.region || "",
      district: clinic.district || "",
      ward: clinic.ward || "",
      street: clinic.street || "",
    });

    setServiceInput("");
    setShowAddForm(true);
  };

  /* ---------------------- DELETE CLINIC ---------------------- */

  const handleDelete = async (clinicId) => {
    const backup = [...clinics];
    const clinicToDelete = clinics.find(c => c._id === clinicId);
    
    // Optimistic UI update - remove clinic immediately
    setClinics(prev => prev.filter(c => c._id !== clinicId));
    
    let undoClicked = false;

    const toastUndo = toast((tToast) => (
      <div className="flex items-center gap-3">
        <span>{t("clinic_deleted", { name: clinicToDelete?.name || "Clinic" })}</span>
        <button
          onClick={() => {
            undoClicked = true;
            setClinics(backup);
            toast.dismiss(tToast.id);
          }}
          className="text-blue-500 underline font-medium"
        >
          {t("undo")}
        </button>
      </div>
    ));

    // Wait 5 seconds before proceeding with deletion
    const timeoutId = setTimeout(async () => {
      // Only proceed with delete if undo was not clicked
      if (undoClicked) return;

      try {
        await deleteClinic(clinicId);
        toast.success(t("clinic_deleted_successfully"));
        
        // Trigger global event to notify other components
        window.dispatchEvent(new Event("clinicsUpdated"));
        
      } catch (error) {
        console.error("Error deleting clinic:", error);
        setClinics(backup); // Restore backup on error
        toast.error(t("failed_to_delete_clinic"));
      }
    }, 5000);

    // Cleanup timeout if component unmounts
    return () => clearTimeout(timeoutId);
  };

  /* ---------------------- RESET FORM ---------------------- */

  const resetForm = () => {
    setClinicForm({
      name: "",
      address: "",
      contactPhone: "",
      coordinates: [0, 0],
      services: [],
      physiotherapists: [],
      region: "",
      district: "",
      ward: "",
      street: "",
    });

    setLocation({
      region: "",
      district: "",
      ward: "",
      street: "",
    });

    setServiceInput("");
    setShowAddForm(false);
    setEditingClinic(null);
  };

  /* ---------------------- UI ---------------------- */

  return (
    <div className="card bg-white shadow-md p-6 text-tufts">

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

      {/* BODY */}
      {isOpen && (
        <div className="mt-4">

          {/* ADD BUTTON */}
          <div className="flex justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">{t("manage_clinics")}</h3>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-tufts flex items-center gap-2"
            >
              <Plus size={16} />
              {t("add_clinic")}
            </button>
          </div>

          {/* CLINIC LIST */}
          <div className="space-y-4 mb-6">
            {clinics.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_clinics_added")}</p>
            ) : (
              clinics.map((clinic) => (
                <div key={clinic._id} className="border rounded-lg p-4">

                  <div className="flex justify-between">

                    <div>

                      <h4 className="text-caribbean font-semibold">{clinic.name}</h4>

                      <div className="text-sm text-gray-600">

                        <div className="flex gap-2 items-center">
                          <MapPin size={14} />
                          {clinic.address}
                        </div>

                        <div className="flex gap-2 items-center">
                          <Phone size={14} />
                          {clinic.contactPhone}
                        </div>

                        {/* SERVICES */}
                        {clinic.services?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {clinic.services.map((s, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(clinic)}>
                        <Edit2 size={18} />
                      </button>

                      <button onClick={() => handleDelete(clinic._id)}>
                        <Trash2 size={18} className="text-red-500"/>
                      </button>
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>

          {/* ADD / EDIT FORM */}
          {showAddForm && (
            <div className="border-t pt-6 space-y-4 text-tufts">

              {/* Clinic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-tufts">
                  {editingClinic ? t("edit_clinic") : t("add_new_clinic")}
                </h3>

                <input
                  type="text"
                  value={clinicForm.name}
                  onChange={(e)=>setClinicForm(p=>({...p,name:e.target.value}))}
                  placeholder={t("clinic_name")}
                  className="input input-bordered w-full"
                />

                <input
                  type="tel"
                  value={clinicForm.contactPhone}
                  onChange={(e)=>setClinicForm(p=>({...p,contactPhone:e.target.value}))}
                  placeholder={t("contact_phone")}
                  className="input input-bordered w-full"
                />

                {/* Location Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("select_location")} *
                  </label>
                  <LocationSelector 
                    onLocationSelect={handleLocationSelect}
                    initialLocation={location}
                  />
                </div>

                {/* Generated Address */}
                <div>
                  <label className="block text-sm font-medium text-tufts mb-2">
                    {t("generated_address")}
                  </label>
                  <textarea
                    value={clinicForm.address}
                    readOnly
                    rows="2"
                    className="textarea text-gray-700 textarea-bordered w-full bg-gray-50"
                    placeholder={t("address_will_appear_here")}
                  />
                </div>

                {/* GPS Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-tufts mb-2">
                      {t("latitude")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={clinicForm.coordinates[1]}
                      onChange={(e)=>setClinicForm(p=>({
                        ...p,
                        coordinates: [p.coordinates[0], Number(e.target.value)]
                      }))}
                      placeholder={t("enter_latitude")}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tufts mb-2">
                      {t("longitude")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={clinicForm.coordinates[0]}
                      onChange={(e)=>setClinicForm(p=>({
                        ...p,
                        coordinates: [Number(e.target.value), p.coordinates[1]]
                      }))}
                      placeholder={t("enter_longitude")}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                {/* SERVICE INPUT */}
                <div>
                  <label className="block text-sm font-medium text-tufts mb-2">
                    {t("services")}
                  </label>
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={(e)=>setServiceInput(e.target.value)}
                    onKeyDown={handleServiceKeyDown}
                    placeholder={t("type_service_press_enter")}
                    className="input input-bordered w-full"
                  />

                  {/* SERVICE TAGS */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {clinicForm.services.map((service, index) => (
                      <span
                        key={`${service}-${index}`}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {service}

                        <button onClick={() => removeService(index)}>
                          <X size={12}/>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn p-2 bg-caribbean text-white hover:bg-caribbean/90"
                >
                  {loading ? t("saving") : editingClinic ? t("update") : t("add")}
                </button>

                <button
                  onClick={resetForm}
                  className="btn p-2 bg-gray-200 hover:bg-gray-300"
                >
                  {t("cancel")}
                </button>

              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ClinicManagement;
