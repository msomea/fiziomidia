import Location from "../models/Location.js";

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
    const districts = await Location.distinct("district", {
      region: { $regex: new RegExp(`^${region}$`, "i") },
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
    const wards = await Location.distinct("ward", {
      district: { $regex: new RegExp(`^${district}$`, "i") },
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

    const streets = await Location.distinct("street", {
      ward: { $regex: new RegExp(`^${ward}$`, "i") },
    });
    res.json(streets.map((name) => ({ name })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch streets" });
  }
};
