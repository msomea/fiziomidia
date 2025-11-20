import { useEffect, useState } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";

export default function LocationSelector({ onLocationSelect, initialLocation }) {
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [streets, setStreets] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedStreet, setSelectedStreet] = useState("");

  const [loading, setLoading] = useState(false);

  /* ==========================================
     1. FETCH REGIONS
     ========================================== */
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        const res = await API.get("/locations/regions");

        if (!Array.isArray(res.data)) {
          toast.error("Invalid region response");
          return;
        }

        setRegions(res.data); // [{_id, name}]
      } catch (err) {
        console.error(err);
        toast.error("Failed to load regions");
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, []);

  /* ==========================================
     2. FETCH DISTRICTS WHEN REGION CHANGES
     ========================================== */
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedRegion) return setDistricts([]);

      try {
        setLoading(true);
        const res = await API.get(`/locations/districts/${selectedRegion}`);
        setDistricts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load districts");
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [selectedRegion]);

  /* ==========================================
     3. FETCH WARDS WHEN DISTRICT CHANGES
     ========================================== */
  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrict) return setWards([]);

      try {
        setLoading(true);
        const res = await API.get(`/locations/wards/${selectedDistrict}`);
        setWards(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load wards");
        setWards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWards();
  }, [selectedDistrict]);

  /* ==========================================
     4. FETCH STREETS WHEN WARD CHANGES
     ========================================== */
  useEffect(() => {
    const fetchStreets = async () => {
      if (!selectedWard) return setStreets([]);

      try {
        setLoading(true);
        const res = await API.get(`/locations/streets/${selectedWard}`);
        setStreets(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load streets");
        setStreets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStreets();
  }, [selectedWard]);

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
        className="select text-white bg-caribbean select-bordered w-full"
      >
        <option value="">Select Region</option>
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
        className="select text-white bg-caribbean select-bordered w-full"
        disabled={!selectedRegion}
      >
        <option value="">Select District</option>
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
        className="select text-white bg-caribbean select-bordered w-full"
        disabled={!selectedDistrict}
      >
        <option value="">Select Ward</option>
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
        className="select text-white bg-caribbean select-bordered w-full"
        disabled={!selectedWard}
      >
        <option value="">Select Street</option>
        {streets.map((s) => (
          <option key={s._id} value={s.name || s.street}>
            {s.name || s.street}
          </option>
        ))}
      </select>

      {loading && (
        <p className="text-gray-400 italic animate-pulse">Loading...</p>
      )}
    </div>
  );
}
