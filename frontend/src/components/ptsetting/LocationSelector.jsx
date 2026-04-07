import { useEffect, useState } from "react";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import { ChevronDown, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LocationSelector({ onLocationSelect, initialLocation }) {
  const { t } = useTranslation();

  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [streets, setStreets] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedStreet, setSelectedStreet] = useState("");

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  /* Initialize with initial location */
  useEffect(() => {
    if (initialLocation && !isInitialized) {
      setSelectedRegion(initialLocation.region || "");
      setSelectedDistrict(initialLocation.district || "");
      setSelectedWard(initialLocation.ward || "");
      setSelectedStreet(initialLocation.street || "");
      setIsInitialized(true);
    }
  }, [initialLocation, isInitialized]);

  /* Fetch Regions */
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/regions`);
        if (!Array.isArray(res.data)) return toast.error(t("invalid_region_response"));
        setRegions(res.data);
      } catch (err) {
        toast.error(t("failed_load_regions"));
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  /* Fetch Districts */
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedRegion) return setDistricts([]);
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/districts/${selectedRegion}`);
        setDistricts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error(t("failed_load_districts"));
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, [selectedRegion]);

  /* Fetch Wards */
  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrict) return setWards([]);
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/wards/${selectedDistrict}`);
        setWards(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error(t("failed_load_wards"));
      } finally {
        setLoading(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  /* Fetch Streets */
  useEffect(() => {
    const fetchStreets = async () => {
      if (!selectedWard) return setStreets([]);
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/streets/${selectedWard}`);
        setStreets(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error(t("failed_load_streets"));
      } finally {
        setLoading(false);
      }
    };
    fetchStreets();
  }, [selectedWard]);

  /* Notify Parent */
  useEffect(() => {
    // Only notify parent after component is initialized and on actual user changes
    if (isInitialized) {
      onLocationSelect({
        region: selectedRegion,
        district: selectedDistrict,
        ward: selectedWard,
        street: selectedStreet,
      });
    }
  }, [selectedRegion, selectedDistrict, selectedWard, selectedStreet, isInitialized, onLocationSelect]);

  return (
    <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {t("location")}
        </h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Body */}
      {isOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {/* REGION */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedDistrict("");
              setSelectedWard("");
              setSelectedStreet("");
            }}
            className="select text-white bg-caribbean select-bordered w-full"
          >
            <option value="">{t("select_region")}</option>
            {regions.map((r) => (
              <option key={r._id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          {/* DISTRICT */}
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedWard("");
              setSelectedStreet("");
            }}
            disabled={!selectedRegion}
            className="select text-white bg-caribbean select-bordered w-full"
          >
            <option value="">{t("select_district")}</option>
            {districts.map((d) => (
              <option key={d._id} value={d.name || d.district}>
                {d.name || d.district}
              </option>
            ))}
          </select>

          {/* WARD */}
          <select
            value={selectedWard}
            onChange={(e) => {
              setSelectedWard(e.target.value);
              setSelectedStreet("");
            }}
            disabled={!selectedDistrict}
            className="select text-white bg-caribbean select-bordered w-full"
          >
            <option value="">{t("select_ward")}</option>
            {wards.map((w) => (
              <option key={w._id} value={w.name || w.ward}>
                {w.name || w.ward}
              </option>
            ))}
          </select>

          {/* STREET */}
          <select
            value={selectedStreet}
            onChange={(e) => setSelectedStreet(e.target.value)}
            disabled={!selectedWard}
            className="select text-white bg-caribbean select-bordered w-full"
          >
            <option value="">{t("select_street")}</option>
            {streets.map((s) => (
              <option key={s._id} value={s.name || s.street}>
                {s.name || s.street}
              </option>
            ))}
          </select>

          {loading && (
            <p className="text-gray-400 italic animate-pulse">{t("loading")}</p>
          )}
        </div>
      )}
    </div>
  );
}
