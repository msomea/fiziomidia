import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Phone, Building, ChevronDown, X } from "lucide-react";
import { createClinic, updateClinic, deleteClinic, getPTClinics } from "../../api/clinics";
import toast from "react-hot-toast";

const ClinicManagement = ({ formData, setFormData, user, t }) => {
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
    physiotherapists: []
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const data = await getPTClinics(user._id);
      setClinics(data);

      setFormData(prev => ({
        ...prev,
        clinicIds: data.map(c => c._id)
      }));
    } catch (error) {
      console.error("Error fetching clinics:", error);
      toast.error(t("failed_to_load_clinics"));
    }
  };

  /* ---------------------- SERVICE INPUT ---------------------- */

  const addService = () => {
    const value = serviceInput.trim();
    if (!value) return;

    console.log("🔥 Adding service:", value);
    console.log("🔥 Current services before:", clinicForm.services);

    if (clinicForm.services.includes(value)) {
      toast.error(t("service_already_added"));
      return;
    }

    setClinicForm(prev => {
      const newServices = [...prev.services, value];
      console.log("🔥 New services array:", newServices);
      return {
        ...prev,
        services: newServices
      };
    });

    setServiceInput("");
    console.log("🔥 Service added, input cleared");
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

    // Debug: Log services array
    console.log("🔥 Services being submitted:", clinicForm.services);
    console.log("🔥 Services type:", typeof clinicForm.services);
    console.log("🔥 Services length:", clinicForm.services.length);

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
        physiotherapists: clinicForm.physiotherapists
      };

      console.log("🔥 Full clinicData:", clinicData);

      if (editingClinic) {
        await updateClinic(editingClinic._id, clinicData);
        toast.success(t("clinic_updated"));
      } else {
        await createClinic(clinicData);
        toast.success(t("clinic_added"));
      }

      resetForm();
      await fetchClinics();
      window.dispatchEvent(new Event("clinicsUpdated"));

    } catch (error) {
      console.error("Error saving clinic:", error);
      toast.error(t("failed_to_save_clinic"));
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
      physiotherapists: clinic.physiotherapists || []
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
        
        // Update formData.clinicIds
        setFormData(prev => ({
          ...prev,
          clinicIds: backup.filter(c => c._id !== clinicId).map(c => c._id)
        }));
        
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
      physiotherapists: []
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
            <div className="border-t pt-6 space-y-4">

              <input
                type="text"
                value={clinicForm.name}
                onChange={(e)=>setClinicForm(p=>({...p,name:e.target.value}))}
                placeholder={t("clinic_name")}
                className="input input-bordered w-full"
              />

              <textarea
                value={clinicForm.address}
                onChange={(e)=>setClinicForm(p=>({...p,address:e.target.value}))}
                placeholder={t("clinic_address")}
                className="input input-bordered w-full"
              />

              <input
                type="tel"
                value={clinicForm.contactPhone}
                onChange={(e)=>setClinicForm(p=>({...p,contactPhone:e.target.value}))}
                placeholder={t("contact_phone")}
                className="input input-bordered w-full"
              />

              {/* SERVICE INPUT */}
              <div>

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
                  {clinicForm.services.map((service,index)=>(
                    <span
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {service}

                      <button onClick={()=>removeService(index)}>
                        <X size={12}/>
                      </button>
                    </span>
                  ))}
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