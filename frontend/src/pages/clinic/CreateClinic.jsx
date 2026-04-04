import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import LocationSelector from "../../components/location/LocationSelector";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";

const CreateClinic = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactPhone: "",
    services: "",
    latitude: "",
    longitude: "",
  });

  const [location, setLocation] = useState({
    region: "",
    district: "",
    ward: "",
    street: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    
    setFormData(prev => ({
      ...prev,
      address: fullAddress
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate location selection
    if (!location.region || !location.district) {
      toast.error(t("please_select_region_and_district"));
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        contactPhone: formData.contactPhone,
        services: formData.services.split(",").map((s) => s.trim()).filter(s => s),
        location: {
          type: "Point",
          coordinates: [
            Number(formData.longitude),
            Number(formData.latitude),
          ],
        },
        // Add location data for backend
        region: location.region,
        district: location.district,
        ward: location.ward,
        street: location.street,
        ownerUserId: user.id,
      };

      const res = await API.post(`${API_URL}/clinics`, payload);

      toast.success(t("clinic_created_success"));
      console.log(res.data);
      
      // Navigate to clinic details or dashboard
      navigate(`/clinic/${res.data._id}`);
      
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || t("clinic_create_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-caribbean text-center">
        {t("create_clinic")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clinic Information */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
          <h2 className="text-xl font-semibold text-tufts mb-4">
            {t("clinic_information")}
          </h2>

          {/* Clinic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("clinic_name")} *
            </label>
            <input
              type="text"
              name="name"
              placeholder={t("enter_clinic_name")}
              value={formData.name}
              onChange={handleChange}
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("contact_phone")}
            </label>
            <input
              type="tel"
              name="contactPhone"
              placeholder={t("enter_phone_number")}
              value={formData.contactPhone}
              onChange={handleChange}
              className="input input-bordered w-full"
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("services")} ({t("comma_separated")})
            </label>
            <textarea
              name="services"
              rows="3"
              placeholder={t("enter_services_comma")}
              value={formData.services}
              onChange={handleChange}
              className="textarea textarea-bordered w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("services_example")}
            </p>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
          <h2 className="text-xl font-semibold text-tufts mb-4">
            {t("location_information")}
          </h2>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("generated_address")}
            </label>
            <textarea
              value={formData.address}
              readOnly
              rows="2"
              className="textarea textarea-bordered w-full bg-gray-50"
              placeholder={t("address_will_appear_here")}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("address_auto_generated")}
            </p>
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
          <h2 className="text-xl font-semibold text-tufts mb-4">
            {t("gps_coordinates")}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t("gps_coordinates_description")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latitude */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("latitude")} *
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                placeholder={t("enter_latitude")}
                value={formData.latitude}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("longitude")} *
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                placeholder={t("enter_longitude")}
                value={formData.longitude}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="btn bg-caribbean text-white px-8 py-3 text-lg hover:bg-tufts disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("creating_clinic")}
              </span>
            ) : (
              t("create_clinic")
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClinic;