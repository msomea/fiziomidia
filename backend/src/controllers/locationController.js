import Location from "../models/Location.js";
import escapeRegExp from "../utils/escapeRegExp.js";

export const getRegions = async (req, res) => {
  try {
    const regions = await Location.distinct("region");
    res.json(regions.map((name) => ({ _id: name, name })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
};


export const getDistricts = async (req, res) => {
  try {
    const { region }= req.params;
    if (!region) return res.status(400).json({ error: "Region required" });
    // Case-insensitive match
    const escRegion = escapeRegExp(region);
    const districts = await Location.distinct("district", {
      region: { $regex: `^${escRegion}$`, $options: "i" },
    });
    res.json(districts.map((name) => ({ name })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch districts" });
  }
};


export const getWards = async (req, res) => {
  try {
    const { district} = req.params;
    if (!district)
      return res.status(400).json({ error: "Region and District required" });
    const escDistrict = escapeRegExp(district);
    const wards = await Location.distinct("ward", {
      district: { $regex: `^${escDistrict}$`, $options: "i" },
    });
    res.json(wards.map((name) => ({ name })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wards" });
  }
};


export const getStreets = async (req, res) => {
  try {
    const { ward } = req.params;
    if (!ward)
      return res.status(400).json({ error: "Region, District, and Ward required" });

    const escWard = escapeRegExp(ward);
    const streets = await Location.distinct("street", {
      ward: { $regex: `^${escWard}$`, $options: "i" },
    });
    res.json(streets.map((name) => ({ name })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch streets" });
  }
};
