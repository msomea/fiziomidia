import { useEffect, useState } from "react";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
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

  // ==========================================
  // 1. FETCH REGIONS
  // ==========================================
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/regions`);
        if (!Array.isArray(res.data)) {
          toast.error(t("invalid_region_response"));
          return;
        }
        setRegions(res.data);
      } catch (err) {
        console.error(err);
        toast.error(t("failed_load_regions"));
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, [t]);

  // ==========================================
  // 2. FETCH DISTRICTS
  // ==========================================
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedRegion) return setDistricts([]);
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/districts/${selectedRegion}`);
        setDistricts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error(t("failed_load_districts"));
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, [selectedRegion, t]);

  // ==========================================
  // 3. FETCH WARDS
  // ==========================================
  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrict) return setWards([]);
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/wards/${selectedDistrict}`);
        setWards(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error(t("failed_load_wards"));
        setWards([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWards();
  }, [selectedDistrict, t]);

  // ==========================================
  // 4. FETCH STREETS
  // ==========================================
  useEffect(() => {
    const fetchStreets = async () => {
      if (!selectedWard) return setStreets([]);
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/locations/streets/${selectedWard}`);
        setStreets(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error(t("failed_load_streets"));
        setStreets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStreets();
  }, [selectedWard, t]);

  // Notify parent
  useEffect(() => {
    const geoJson = {
      region: selectedRegion,
      district: selectedDistrict,
      ward: selectedWard,
      street: selectedStreet,
    };
    onLocationSelect(geoJson);
  }, [selectedRegion, selectedDistrict, selectedWard, selectedStreet]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
      {/* REGION */}
      <select
        value={selectedRegion}
        onChange={(e) => {
          setSelectedRegion(e.target.value);
          setSelectedDistrict("");
          setSelectedWard("");
          setSelectedStreet("");
        }}
        className="select select-bordered w-full"
      >
        <option value="">{t("select_region")}</option>
        {regions.map((r) => (
          <option key={r._id} value={r.name}>{r.name}</option>
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
        className="select select-bordered w-full"
        disabled={!selectedRegion}
      >
        <option value="">{t("select_district")}</option>
        {districts.map((d) => (
          <option key={d._id} value={d.name || d.district}>{d.name || d.district}</option>
        ))}
      </select>

      {/* WARD */}
      <select
        value={selectedWard}
        onChange={(e) => {
          setSelectedWard(e.target.value);
          setSelectedStreet("");
        }}
        className="select select-bordered w-full"
        disabled={!selectedDistrict}
      >
        <option value="">{t("select_ward")}</option>
        {wards.map((w) => (
          <option key={w._id} value={w.name || w.ward}>{w.name || w.ward}</option>
        ))}
      </select>

      {/* STREET */}
      <select
        value={selectedStreet}
        onChange={(e) => setSelectedStreet(e.target.value)}
        className="select select-bordered w-full"
        disabled={!selectedWard}
      >
        <option value="">{t("select_street")}</option>
        {streets.map((s) => (
          <option key={s._id} value={s.name || s.street}>{s.name || s.street}</option>
        ))}
      </select>

      {loading && <p className="text-gray-400 italic animate-pulse">{t("loading")}</p>}
    </div>
  );
}
