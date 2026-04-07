import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Phone, Building, ChevronDown, X, Upload, Search, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router";
import { createClinic, updateClinic, deleteClinic, getUserClinics, searchPhysiotherapists, sendPTRequest, getPTRequests, respondToPTRequest } from "../../api/clinics";
import toast from "react-hot-toast";
import LocationSelector from "../location/LocationSelector";

const ClinicManagement = ({ user, t }) => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [serviceInput, setServiceInput] = useState("");
  
  // PT Selection states
  const [ptSearchQuery, setPtSearchQuery] = useState("");
  const [ptSearchResults, setPtSearchResults] = useState([]);
  const [selectedPT, setSelectedPT] = useState(null);
  const [showPTSearch, setShowPTSearch] = useState(false);
  const [ptRequests, setPtRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    contactPhone: "",
    coordinates: [0, 0],
    services: [],
    physiotherapists: [],
    imageUrl: null,
    imageFile: null,
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

  useEffect(() => {
    if (editingClinic) {
      fetchPTRequests(editingClinic._id);
    }
  }, [editingClinic]);

  const fetchClinics = async () => {
    if (!user || !user._id) {
      setClinics([]);
      return;
    }
    
    try {
      const data = await getUserClinics(user._id);
      setClinics(data);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      toast.error(t("failed_to_load_clinics"));
    }
  };

  const fetchPTRequests = async (clinicId) => {
    try {
      const requests = await getPTRequests(clinicId);
      setPtRequests(requests);
    } catch (error) {
      console.error("Error fetching PT requests:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("image_too_large"));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setClinicForm(prev => ({
          ...prev,
          imageFile: file,
          imageUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setClinicForm(prev => ({
      ...prev,
      imageFile: null,
      imageUrl: null
    }));
  };

  const searchPTs = async (query) => {
    if (!query.trim()) {
      setPtSearchResults([]);
      return;
    }
    
    try {
      const results = await searchPhysiotherapists(query);
      setPtSearchResults(results);
    } catch (error) {
      console.error("Error searching PTs:", error);
      toast.error(t("failed_to_search_pts"));
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPTs(ptSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ptSearchQuery]);

  const selectPT = (pt) => {
    setSelectedPT(pt);
    setPtSearchQuery("");
    setPtSearchResults([]);
    setShowPTSearch(false);
  };

  const sendPTInvite = async () => {
    if (!selectedPT || !editingClinic) return;
    
    try {
      await sendPTRequest({
        clinicId: editingClinic._id,
        physiotherapistId: selectedPT._id,
        message: requestMessage
      });
      
      toast.success(t("pt_request_sent"));
      setSelectedPT(null);
      setRequestMessage("");
      fetchPTRequests(editingClinic._id);
    } catch (error) {
      console.error("Error sending PT request:", error);
      toast.error(error.response?.data?.message || t("failed_to_send_request"));
    }
  };

  const handlePTResponse = async (requestId, action) => {
    try {
      await respondToPTRequest(requestId, action);
      toast.success(t(`request_${action}`));
      fetchPTRequests(editingClinic._id);
    } catch (error) {
      console.error(`Error ${action} PT request:`, error);
      toast.error(t(`failed_to_${action}_request`));
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
      const formData = new FormData();
      
      // Add all clinic data
      formData.append('name', clinicForm.name);
      formData.append('address', clinicForm.address);
      formData.append('contactPhone', clinicForm.contactPhone);
      formData.append('location', JSON.stringify({
        type: "Point",
        coordinates: clinicForm.coordinates
      }));
      formData.append('services', JSON.stringify(clinicForm.services));
      formData.append('physiotherapists', JSON.stringify(clinicForm.physiotherapists));
      formData.append('region', location.region);
      formData.append('district', location.district);
      formData.append('ward', location.ward);
      formData.append('street', location.street);
      
      // Add image if exists
      if (clinicForm.imageFile) {
        formData.append('clinic', clinicForm.imageFile);
      }

      if (editingClinic) {
        await updateClinic(editingClinic._id, formData);
        toast.success(t("clinic_updated"));
      } else {
        await createClinic(formData);
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
      imageUrl: clinic.imageUrl || null,
      imageFile: null,
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
      imageUrl: null,
      imageFile: null,
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
    setSelectedPT(null);
    setRequestMessage("");
    setPtRequests([]);
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
                      <Link to={`/clinic/${clinic._id}`}>
                        <h4 className="text-caribbean font-semibold">{clinic.name}</h4>
                      </Link>
                      

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

                {/* IMAGE UPLOAD */}
                <div>
                  <label className="block text-sm font-medium text-tufts mb-2">
                    {t("clinic_image")}
                  </label>
                  
                  {clinicForm.imageUrl ? (
                    <div className="relative">
                      <img 
                        src={clinicForm.imageUrl} 
                        alt="Clinic" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-caribbean font-medium">{t("upload_image")}</span>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-gray-500 text-xs mt-1">{t("image_size_limit")}</p>
                      </div>
                    </div>
                  )}
                </div>

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

                {/* PHYSIOTHERAPIST MANAGEMENT */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-tufts">{t("physiotherapist_management")}</h4>
                    
                    {/* PT Selection */}
                    <div>
                      <label className="block text-sm font-medium text-tufts mb-2">
                        {t("invite_physiotherapist")}
                      </label>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={ptSearchQuery}
                          onChange={(e) => {
                            setPtSearchQuery(e.target.value);
                            setShowPTSearch(true);
                          }}
                          onFocus={() => setShowPTSearch(true)}
                          placeholder={t("search_physiotherapists")}
                          className="input input-bordered w-full pl-10"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {showPTSearch && ptSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                          {ptSearchResults.map((pt) => (
                            <div
                              key={pt._id}
                              onClick={() => selectPT(pt)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                {pt.profileImageUrl ? (
                                  <img
                                    src={pt.profileImageUrl}
                                    alt={pt.fullName}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-8 h-8 text-gray-400" />
                                )}
                                <div>
                                  <p className="font-medium text-sm">{pt.fullName}</p>
                                  <p className="text-xs text-gray-500">
                                    {pt.ptProfile?.speciality?.join(", ") || t("general_physiotherapy")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected PT */}
                    {selectedPT && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {selectedPT.profileImageUrl ? (
                              <img
                                src={selectedPT.profileImageUrl}
                                alt={selectedPT.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-10 h-10 text-blue-500" />
                            )}
                            <div>
                              <p className="font-medium">{selectedPT.fullName}</p>
                              <p className="text-xs text-gray-600">
                                {selectedPT.ptProfile?.speciality?.join(", ") || t("general_physiotherapy")}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedPT(null)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        
                        <textarea
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          placeholder={t("optional_message_to_pt")}
                          className="textarea textarea-bordered w-full mt-3 text-sm"
                          rows="2"
                        />
                        
                        <button
                          onClick={sendPTInvite}
                          className="btn bg-caribbean text-white hover:bg-caribbean/90 mt-3 w-full"
                        >
                          {t("send_invitation")}
                        </button>
                      </div>
                    )}
                    
                    {/* PT Requests */}
                    {ptRequests.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-sm font-medium text-tufts">{t("pending_requests")}</h5>
                          <button
                            onClick={() => setShowRequests(!showRequests)}
                            className="text-caribbean text-sm hover:underline"
                          >
                            {showRequests ? t("hide") : t("show")} ({ptRequests.length})
                          </button>
                        </div>
                        
                        {showRequests && (
                          <div className="space-y-2">
                            {ptRequests.map((request) => (
                              <div key={request._id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {request.physiotherapistId.profileImageUrl ? (
                                      <img
                                        src={request.physiotherapistId.profileImageUrl}
                                        alt={request.physiotherapistId.fullName}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className="w-8 h-8 text-gray-400" />
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">{request.physiotherapistId.fullName}</p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock size={12} />
                                        {new Date(request.requestedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {request.status === "pending" ? (
                                      <div className="flex items-center gap-2 text-yellow-600">
                                        <Clock size={16} />
                                        <span className="text-xs font-medium">{t("pending")}</span>
                                      </div>
                                    ) : request.status === "accepted" ? (
                                      <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle size={16} />
                                        <span className="text-xs font-medium">{t("accepted")}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-red-600">
                                        <XCircle size={16} />
                                        <span className="text-xs font-medium">{t("rejected")}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {request.message && (
                                  <p className="text-xs text-gray-600 mt-2 italic">"{request.message}"</p>
                                )}
                                
                                {request.responseMessage && (
                                  <p className="text-xs text-blue-600 mt-2 italic">"{request.responseMessage}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
