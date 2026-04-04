import Clinic from "../models/Clinic.js";
import User from "../models/User.js";

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
    const clinic = await Clinic.findById(id)
      .populate('ownerUserId', 'fullName email phone')
      .populate('physiotherapists', 'fullName email phone');
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }
    res.json(clinic);
  } catch (error) {
    console.error("Error fetching clinic:", error);
    res.status(500).json({ error: "Failed to fetch clinic" });
  }
};

export const getClinicsByPT = async (req, res) => {
  try {
    const { ptId } = req.params;
    
    const clinics = await Clinic.find({ ownerUserId: ptId })
      .populate('ownerUserId', 'fullName email phone')
      .populate('physiotherapists', 'fullName email phone');
    
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

    const clinics = await Clinic.find({ ownerUserId: userId })
      .populate("ownerUserId", "fullName email phone")
      .populate("physiotherapists", "fullName email phone");

    res.json(clinics);
  } catch (error) {
    console.error("Error fetching user clinics:", error);
    res.status(500).json({ error: "Failed to fetch user clinics" });
  }
};

export const createClinic = async (req, res) => {
  try {
    const {
      name,
      address,
      contactPhone,
      location,
      services,
      physiotherapists,
    } = req.body;

    if (!name || !address || !contactPhone) {
      return res
        .status(400)
        .json({ error: "Name, address, and contact phone are required" });
    }

    const clinicData = {
      name,
      address,
      contactPhone,
      location: location || {
        type: "Point",
        coordinates: [0, 0],
      },
      ownerUserId: req.user._id,
      services: services || [],
      physiotherapists: physiotherapists || [],
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

    res.status(201).json(clinic);
  } catch (error) {
    console.error("Error creating clinic:", error);
    res.status(500).json({ error: "Failed to create clinic" });
  }
};

export const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      address,
      contactPhone,
      coordinates,
      services,
      physiotherapists,
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
    if (Array.isArray(services)) {
      updateData.services = services.filter((s) => s.trim() !== "");
    }

    // Optional
    if (Array.isArray(physiotherapists)) {
      updateData.physiotherapists = physiotherapists;
    }

    // Update location
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      updateData.location = {
        type: "Point",
        coordinates: coordinates,
      };
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

    res.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    res.status(500).json({ error: "Failed to delete clinic" });
  }
};
