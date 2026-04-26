import API from "./axios";
import { API_URL } from "../config/constants";

// Fetch all regions
export const fetchRegions = async () => {
  const res = await API.get(`${API_URL}/locations/regions`);
  return res.data;
};

// Fetch districts by region
export const fetchDistrictsByRegion = async (regionName) => {
  const res = await API.get(`${API_URL}/locations/districts/${regionName}`);
  return res.data;
};

// Fetch wards by district
export const fetchWardsByDistrict = async (districtName) => {
  const res = await API.get(`${API_URL}/locations/wards/${districtName}`);
  return res.data;
};

// Fetch streets by ward
export const fetchStreetsByWard = async (wardName) => {
  const res = await API.get(`${API_URL}/locations/streets/${wardName}`);
  return res.data;
};
