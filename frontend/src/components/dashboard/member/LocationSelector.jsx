import { useEffect, useState } from "react";
import API from "../../../api/axios";
import toast from "react-hot-toast";

export default function LocationSelector({ onLocationSelect }) {
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedStreet, setSelectedStreet] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        const response = await API.get("/locations/regions");
        console.log("Regions",response)
        if (Array.isArray(response.data)) setRegions(response.data);
        else toast.error("Invalid region data format");
      } catch (err) {
        console.error("Error fetching regions:", err);
        toast.error("Failed to load regions");
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  // Fetch districts when region changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedRegion) return setDistricts([]);
      try {
        setLoading(true);
        const response = await API.get(`/locations/districts?region=${selectedRegion}`);
        if (Array.isArray(response.data)) setDistricts(response.data);
        else setDistricts([]);
      } catch (err) {
        console.error("Error fetching districts:", err);
        toast.error("Failed to load districts");
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, [selectedRegion]);

  // Send GeoJSON to parent whenever location changes
  useEffect(() => {
    const geoJson = {
      type: "Point",
      coordinates: [0, 0], // dummy coordinates
      region: selectedRegion,
      district: selectedDistrict,
      ward: selectedWard,
      street: selectedStreet,
    };
    onLocationSelect(geoJson);
  }, [selectedRegion, selectedDistrict, selectedWard, selectedStreet, onLocationSelect]);

  return (
    <div className="space-y-2 mt-1">
      {/* Region */}
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
        <option value="">Select Region</option>
        {regions.map((r) => (
          <option key={r._id || r.region} value={r.region}>
            {r.region}
          </option>
        ))}
      </select>

      {/* District */}
      <select
        value={selectedDistrict}
        onChange={(e) => setSelectedDistrict(e.target.value)}
        className="select select-bordered w-full"
        disabled={!selectedRegion || districts.length === 0}
      >
        <option value="">Select District</option>
        {districts.map((d) => (
          <option key={d._id || d.district} value={d.district}>
            {d.district}
          </option>
        ))}
      </select>

      {/* Ward */}
      <input
        type="text"
        placeholder="Ward"
        value={selectedWard}
        onChange={(e) => setSelectedWard(e.target.value)}
        className="input input-bordered w-full"
        disabled={!selectedDistrict}
      />

      {/* Street */}
      <input
        type="text"
        placeholder="Street"
        value={selectedStreet}
        onChange={(e) => setSelectedStreet(e.target.value)}
        className="input input-bordered w-full"
        disabled={!selectedWard}
      />

      {loading && (
        <p className="text-sm text-gray-500 italic animate-pulse">
          Loading location data...
        </p>
      )}
    </div>
  );
}
