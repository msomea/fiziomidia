import Clinic from "../models/Clinic.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { CacheService } from "../utils/redis.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/uploadService.js";

export const getAllClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find()
      .populate('ownerUserId', 'fullName email phone')
      .populate('physiotherapists', 'fullName email phone');
    res.json(clinics);
  } catch (error) {
    console.error("Error fetching clinics:", error);
    res.status(500).json({ error: "Failed to fetch clinics" });
  }
};

export const getClinicById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid clinic ID" });
    }
    const clinic = await Clinic.findById(id)
      .populate('ownerUserId', 'fullName email phone profileImageUrl')
      .populate('physiotherapists', 'fullName email phone profileImageUrl');
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }
    res.json(clinic);
  } catch (error) {
    console.error("Error fetching clinic:", error);
    res.status(500).json({ error: "Failed to fetch clinic" });
  }
};

export const getClinicOwnedByPT = async (req, res) => {
  try {
    const { ptId } = req.params; 
    // Get clinics where PT is the owner
    const clinics = await Clinic.find({
      $or: [
        { ownerUserId: ptId },
      ],
    })
      .populate("ownerUserId", "fullName email phone")
      .populate("physiotherapists", "fullName email phone");

    res.json(clinics);
  } catch (error) {
    console.error("Error fetching clinic:", error);
    res.status(500).json({ error: "Failed to fetch clinic" });
  }
}

export const getClinicsPTWork = async (req, res) => {
  try {
    const { ptId } = req.params;

    // First get the PT to find their associated clinic IDs
    const pt = await User.findById(ptId).select("ptProfile.clinicIds");

    if (!pt) {
      return res.status(404).json({ error: "PT not found" });
    }

    // Get clinics where PT is the owner OR works at (through ptProfile.clinicIds)
    const clinics = await Clinic.find({
      $or: [
        { ownerUserId: ptId },
        { _id: { $in: pt.ptProfile?.clinicIds || [] } },
      ],
    })
      .populate("ownerUserId", "fullName email phone")
      .populate("physiotherapists", "fullName email phone");

    res.json(clinics);
  } catch (error) {
    console.error("Error fetching PT clinics:", error);
    res.status(500).json({ error: "Failed to fetch PT clinics" });
  }
};

export const getClinicsByUser = async (req, res) => {
  try {
    // For authenticated "my-clinics" route, use req.user.id
    // For parameter route /user/:userId, use req.params.userId
    const userId = req.params.userId || req.user.id;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const clinics = await Clinic.find({ ownerUserId: userId })
      .populate("ownerUserId", "fullName email phone profileImageUrl")
      .populate("physiotherapists", "fullName email phone profileImageUrl");

    res.json(clinics);
  } catch (error) {
    console.error("Error fetching user clinics:", error);
    res.status(500).json({ error: "Failed to fetch user clinics" });
  }
};

export const createClinic = async (req, res) => {
  try {
    // Handle FormData if it's FormData, otherwise handle JSON
    let clinicData;

    if (req.body instanceof FormData) {
      // This shouldn't happen with multer, but just in case
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Parse JSON fields from FormData
    const {
      name,
      address,
      contactPhone,
      location,
      services,
      physiotherapists,
      region,
      district,
      ward,
      street,
    } = req.body;

    // Parse JSON strings if they were stringified
    const parsedLocation =
      typeof location === "string" ? JSON.parse(location) : location;
    const parsedServices =
      typeof services === "string" ? JSON.parse(services) : services;
    const parsedPhysiotherapists =
      typeof physiotherapists === "string"
        ? JSON.parse(physiotherapists)
        : physiotherapists;

    if (!name || !address || !contactPhone) {
      return res
        .status(400)
        .json({ error: "Name, address, and contact phone are required" });
    }

    // Handle image upload if present
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file);
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Error uploading clinic image:", uploadError);
        return res.status(500).json({ error: "Failed to upload clinic image" });
      }
    }

    clinicData = {
      name,
      address,
      contactPhone,
      location: parsedLocation || {
        type: "Point",
        coordinates: [0, 0],
      },
      ownerUserId: req.user._id,
      services: parsedServices || [],
      physiotherapists: parsedPhysiotherapists || [],
      imageUrl,
      imagePublicId,
      rating: {
        average: 0,
        count: 0,
      },
      region,
      district,
      ward,
      street,
    };

    const clinic = new Clinic(clinicData);
    await clinic.save();

    // Update user's clinicIds array based on user role
    const user = await User.findById(req.user._id);

    if (user.role === "physiotherapist" && user.ptProfile) {
      // For PT users: Update ptProfile.clinicIds
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { "ptProfile.clinicIds": clinic._id },
        },
        { new: true },
      );
    } else {
      // For regular members: Create or update clinicIds in main User schema
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { clinicIds: clinic._id },
        },
        { new: true, upsert: true },
      );
    }

    // Invalidate user profile cache due to clinic association change
    await CacheService.del(`user:${req.user._id}:profile`);
    console.log(
      `🗑️ User profile cache invalidated for user: ${req.user._id} due to clinic association`,
    );

    res.status(201).json(clinic);
  } catch (error) {
    console.error("Error creating clinic:", error);
    res.status(500).json({ error: "Failed to create clinic" });
  }
};

export const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;

    // Parse JSON fields from FormData
    const {
      name,
      address,
      contactPhone,
      coordinates,
      services,
      physiotherapists,
      region,
      district,
      ward,
      street,
    } = req.body;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    // Ownership check
    if (clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this clinic" });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (contactPhone) updateData.contactPhone = contactPhone;

    // ✅ FIX: update services (FULL overwrite)
    const parsedServices =
      typeof services === "string" ? JSON.parse(services) : services;
    if (Array.isArray(parsedServices)) {
      updateData.services = parsedServices.filter((s) => s.trim() !== "");
    }

    // Optional
    const parsedPhysiotherapists =
      typeof physiotherapists === "string"
        ? JSON.parse(physiotherapists)
        : physiotherapists;
    if (Array.isArray(parsedPhysiotherapists)) {
      updateData.physiotherapists = parsedPhysiotherapists;
    }

    // Update location
    const parsedCoordinates =
      typeof coordinates === "string" ? JSON.parse(coordinates) : coordinates;
    if (
      parsedCoordinates &&
      Array.isArray(parsedCoordinates) &&
      parsedCoordinates.length === 2
    ) {
      updateData.location = {
        type: "Point",
        coordinates: parsedCoordinates,
      };
    }

    // Update location fields
    if (region) updateData.region = region;
    if (district) updateData.district = district;
    if (ward) updateData.ward = ward;
    if (street) updateData.street = street;

    // Handle image upload if present
    if (req.file) {
      try {
        // Delete old image if exists
        if (clinic.imagePublicId) {
          await deleteFromCloudinary(clinic.imagePublicId);
        }

        // Upload new image
        const uploadResult = await uploadToCloudinary(req.file);
        updateData.imageUrl = uploadResult.secure_url;
        updateData.imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Error updating clinic image:", uploadError);
        return res.status(500).json({ error: "Failed to update clinic image" });
      }
    }

    const updatedClinic = await Clinic.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json(updatedClinic);
  } catch (error) {
    console.error("Error updating clinic:", error);
    res.status(500).json({ error: "Failed to update clinic" });
  }
};

export const deleteClinic = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    // Check if user owns this clinic
    if (clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this clinic" });
    }

    // Delete image from Cloudinary if exists
    if (clinic.imagePublicId) {
      try {
        await deleteFromCloudinary(clinic.imagePublicId);
        console.log(
          `🗑️ Deleted clinic image from Cloudinary: ${clinic.imagePublicId}`,
        );
      } catch (deleteError) {
        console.error(
          "Error deleting clinic image from Cloudinary:",
          deleteError,
        );
        // Continue with clinic deletion even if image deletion fails
      }
    }

    await Clinic.findByIdAndDelete(id);

    // Remove clinic ID from user's profile based on user role
    const user = await User.findById(req.user._id);

    if (user.role === "physiotherapist" && user.ptProfile) {
      // For PT users: Remove from ptProfile.clinicIds
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: { "ptProfile.clinicIds": id },
        },
        { new: true },
      );
    } else {
      // For regular members: Remove from main User schema clinicIds
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: { clinicIds: id },
        },
        { new: true },
      );
    }

    // Invalidate user profile cache due to clinic association change
    await CacheService.del(`user:${req.user._id}:profile`);
    console.log(
      `🗑️ User profile cache invalidated for user: ${req.user._id} due to clinic removal`,
    );

    res.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    res.status(500).json({ error: "Failed to delete clinic" });
  }
};
