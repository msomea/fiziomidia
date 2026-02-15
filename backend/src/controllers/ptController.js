import User from "../models/User.js";
import Promotion from "../models/Promotion.js";
import Post from "../models/Post.js";
import Appointment from "../models/Appointment.js";
import dayjs from "dayjs";


// GET /api/pts
export const listPts = async (req, res) => {
  try {
    // simple list with filter for verified/promotion
    const { specialty, verified } = req.query;
    const query = { role: "physiotherapist" };
    if (specialty) query["ptProfile.speciality"] = specialty;
    if (verified === "true") query["ptProfile.licenses.verified"] = true;
    const pts = await User.find(query).limit(50).select("-passwordHash");
    res.json({ pts });
  } catch (err) {
    console.error("Error listing PTs:", err);
    res.status(500).json({ error: "Failed to list PTs" });
  }
};

// GET /api/pts/:id
export const getPTById = async (req, res) => {
  try {
    const ptId = req.params.id;

    const pt = await User.findById(ptId)
      .select("-passwordHash")
      .lean();

    if (!pt) {
      return res.status(404).json({ error: "PT not found" });
    }

    let isSaved = false;

    // If user is logged in and is a member
    if (req.user && req.user.role === "member") {
      const member = await User.findById(req.user._id).select("savedPTs");

      if (member?.savedPTs?.includes(ptId)) {
        isSaved = true;
      }
    }

    res.json({
      ...pt,
      isSaved,
    });
  } catch (err) {
    console.error("Get PT error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// PUT /api/pts/:id - only owner or admin
export const updatePTProfile = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user.role !== "admin" && req.user._id.toString() !== id)
      return res.status(403).json({ error: "Forbidden" });
    const allowed = req.body;
    const pt = await User.findByIdAndUpdate(id, allowed, { new: true }).select(
      "-passwordHash",
    );
    res.json({ pt });
  } catch (err) {
    console.error("Error updating PT profile:", err);
    res.status(500).json({ error: "Failed to update PT profile" });
  }
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

// Get all physiotherapists (PTs) with active promotions
export const getPTsWithActivePromotions = async (req, res) => {
  try {
    // Find all active promotions
    const activePromotions = await Promotion.find({ status: "active" })
      .populate("pt", "fullName profileImageUrl ptProfile role");

    // Map PTs to include their active promotion
    const ptsWithPromotion = activePromotions
      .filter(promo => promo.pt?.role === "physiotherapist")
      .map((promo) => {
        const pt = promo.pt.toObject(); // convert mongoose doc to plain object
        pt.promotion = {
          _id: promo._id,
          title: promo.title,
          price: promo.price,
          imageUrl: promo.imageUrl,
          startAt: promo.startAt,
          endAt: promo.endAt,
          duration: promo.duration,
        };
        return pt;
      });

    res.status(200).json(ptsWithPromotion);
  } catch (error) {
    console.error("Error fetching PTs with promotions:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/pts/:id/dashboard-stats
export const getPTDashboardStats = async (req, res) => {
  try {
    const ptId = req.params.id;
    if (!ptId) return res.status(400).json({ error: "PT ID required" });

    // Initialize stats
    let totalAppointments = await Appointment.countDocuments({ pt: ptId });
    let pendingRequests = await Appointment.countDocuments({ pt: ptId, status: "pending" });
    let totalForumPosts = await Post.countDocuments({ author: ptId });
    let promotionDaysLeft = 0;

    // Find active promotion (can be null)
    const activePromotion = await Promotion.findOne({ pt: ptId, status: "active" });

    if (activePromotion && activePromotion.endAt) {
      const endDate = dayjs(activePromotion.endAt);
      const today = dayjs();
      promotionDaysLeft = endDate.diff(today, "day");
    }

    
    res.json({
      totalAppointments,
      pendingRequests,
      totalForumPosts,
      promotionDaysLeft,
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "❌ Failed to fetch dashboard stats" });
  }
};

