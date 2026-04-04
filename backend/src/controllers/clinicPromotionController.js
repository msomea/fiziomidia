import ClinicPromotion from "../models/ClinicPromotion.js";
import Clinic from "../models/Clinic.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../services/uploadService.js";

/*
========================================
CREATE CLINIC PROMOTION
========================================
*/
export const createClinicPromotion = async (req, res) => {
  try {
    const {
      clinicId,
      title,
      price,
      duration,
      customTitle,
      customDescription,
    } = req.body;

    const clinic = await Clinic.findById(clinicId);

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    // Only clinic owner can create promotion
    if (clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Upload image to Cloudinary if provided
    let imageUrl = null;
    let imagePublicId = null;
    
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const promotion = await ClinicPromotion.create({
      clinic: clinicId,
      title,
      price,
      duration,
      customTitle,
      customDescription,
      imageUrl,
      imagePublicId,
    });

    res.status(201).json({
      message: "Clinic promotion created successfully",
      promotion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
GET ACTIVE PROMOTIONS (PUBLIC)
========================================
*/
export const getActiveClinicPromotions = async (req, res) => {
  try {
    const promotions = await ClinicPromotion.find({
      status: "active",
      endAt: { $gt: new Date() },
    })
      .populate("clinic")
      .sort({ priorityScore: -1, createdAt: -1 });

    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
GET SINGLE PROMOTION
========================================
*/
export const getClinicPromotionById = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id)
      .populate("clinic");

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.json(promotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
GET MY CLINIC PROMOTIONS (OWNER)
========================================
*/
export const getMyClinicPromotions = async (req, res) => {
  try {
    // Find clinics owned by user
    const clinics = await Clinic.find({ ownerUserId: req.user._id });

    const clinicIds = clinics.map((c) => c._id);

    const promotions = await ClinicPromotion.find({
      clinic: { $in: clinicIds },
    })
      .populate("clinic")
      .sort({ createdAt: -1 });

    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
UPDATE PROMOTION
========================================
*/
export const updateClinicPromotion = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id).populate("clinic");

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    // Replace image in cloudinary if new image is provided
    if (req.file) {
      if (promotion.imagePublicId) {
        await deleteFromCloudinary(promotion.imagePublicId);
      }
      const result = await uploadToCloudinary(req.file);
      promotion.imageUrl = result.secure_url;
      promotion.imagePublicId = result.public_id;
    }

    // Only clinic owner can update
    if (promotion.clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updates = req.body;

    Object.assign(promotion, updates);

    await promotion.save();

    res.json({
      message: "Promotion updated successfully",
      promotion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
DELETE PROMOTION
========================================
*/
export const deleteClinicPromotion = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id).populate("clinic");

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    // Only clinic owner can delete
    if (promotion.clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete image from Cloudinary if it exists
    if (promotion?.imagePublicId) {
      await deleteFromCloudinary(promotion.imagePublicId);
    }

    await promotion.deleteOne();

    res.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
TRACK CLICK (ANALYTICS)
========================================
*/
export const trackClinicPromotionClick = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    promotion.clicks += 1;
    await promotion.save();

    res.json({ message: "Click tracked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
TRACK IMPRESSION
========================================
*/
export const trackClinicPromotionImpression = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    promotion.impressions += 1;
    await promotion.save();

    res.json({ message: "Impression tracked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};