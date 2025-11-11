import React, { useState, useEffect } from "react";
import axios from "axios";

const LocationSelector = ({ onLocationSelect }) => {
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [streets, setStreets] = useState([]);

  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [street, setStreet] = useState("");

  // Fetch all regions on mount
  useEffect(() => {
    axios.get("/api/locations/regions")
      .then(res => setRegions(res.data))
      .catch(err => console.error("Error fetching regions", err));
  }, []);

  // Fetch districts when region changes
  useEffect(() => {
    if (region) {
      console.log("Selected region", region)
      axios.get(`/api/locations/districts/${region}`)
        .then(res => setDistricts(res.data))
        .catch(err => console.error("Error fetching districts", err));
      setWards([]);
      setStreets([]);
      setDistrict("");
      setWard("");
      setStreet("");
      console.log("returned districts", districts)
    }
  }, [region]);

  // Fetch wards when district changes
  useEffect(() => {
    if (district) {
      axios.get(`/api/locations/wards/${district}`)
        .then(res => setWards(res.data))
        .catch(err => console.error("Error fetching wards", err));
      setStreets([]);
      setWard("");
      setStreet("");
    }
  }, [district]);

  // Fetch streets when ward changes
  useEffect(() => {
    if (ward) {
      axios.get(`/api/locations/streets/${ward}`)
        .then(res => setStreets(res.data))
        .catch(err => console.error("Error fetching streets", err));
      setStreet("");
    }
  }, [ward]);

  // Notify parent when location fully selected
  useEffect(() => {
    if (region && district && ward && street) {
      onLocationSelect({ region, district, ward, street });
    }
  }, [region, district, ward, street, onLocationSelect]);

  return (
    <div className="location-selector" style={{ display: "grid", gap: "10px" }}>
      <select value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="">Select Region</option>
        {regions.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
      </select>

      <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!region}>
        <option value="">Select District</option>
        {districts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
      </select>

      <select value={ward} onChange={(e) => setWard(e.target.value)} disabled={!district}>
        <option value="">Select Ward</option>
        {wards.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
      </select>

      <select value={street} onChange={(e) => setStreet(e.target.value)} disabled={!ward}>
        <option value="">Select Street</option>
        {streets.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
      </select>
    </div>
  );
};

export default LocationSelector;
