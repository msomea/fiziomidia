import User from "../models/User.js";

// GET /api/pts
export const listPts = async (req, res) => {
  // simple list with filter for verified/promotion
  const { specialty, verified } = req.query;
  const query = { role: "physiotherapist" };
  if (specialty) query["ptProfile.specialties"] = specialty;
  if (verified === "true") query["ptProfile.licenseVerified"] = true;
  const pts = await User.find(query).limit(50).select("-passwordHash");
  res.json({ pts });
};

// GET /api/pts/:id
export const getPTById = async (req, res) => {
  const pt = await User.findById(req.params.id).select("-passwordHash");
  if (!pt) return res.status(404).json({ error: "Not found" });
  res.json({ pt });
};

// PUT /api/pts/:id - only owner or admin
export const updatePTProfile = async (req, res) => {
  const id = req.params.id;
  if (req.user.role !== "admin" && req.user._id.toString() !== id)
    return res.status(403).json({ error: "Forbidden" });
  const allowed = req.body;
  const pt = await User.findByIdAndUpdate(id, allowed, { new: true }).select(
    "-passwordHash"
  );
  res.json({ pt });
};

// Get saved PTs for a member
export const getSavedPTsByMember = async (req, res) => {
  try {
    const memberId = req.params.id;

    // Only allow admin or the member themselves
    if (req.user.role !== "admin" && req.user._id.toString() !== memberId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const member = await User.findById(memberId).populate({
      path: "savedPTs",
      select: "name title location services",
    });

    if (!member) return res.status(404).json({ error: "Member not found" });

    res.json({ savedPTs: member.savedPTs || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
