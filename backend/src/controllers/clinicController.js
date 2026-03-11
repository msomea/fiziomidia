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

export const createClinic = async (req, res) => {
  try {
    console.log("🔥 Backend: createClinic called");
    console.log("🔥 Backend: req.body:", JSON.stringify(req.body, null, 2));
    console.log("🔥 Backend: services received:", req.body.services);
    console.log("🔥 Backend: services type:", typeof req.body.services);
    console.log("🔥 Backend: services length:", req.body.services?.length);
    
    const { name, address, contactPhone, location, services, physiotherapists } = req.body;
    
    if (!name || !address || !contactPhone) {
      return res.status(400).json({ error: "Name, address, and contact phone are required" });
    }

    const clinicData = {
      name,
      address,
      contactPhone,
      location: location || {
        type: "Point",
        coordinates: [0, 0]
      },
      ownerUserId: req.user._id,
      services: services || [],
      physiotherapists: physiotherapists || []
    };

    console.log(
      "🔥 Backend: Final clinicData to save:",
      JSON.stringify(clinicData, null, 2),
    );

    const clinic = new Clinic(clinicData);
    await clinic.save();

    // Update user's clinicIds array if it exists in their profile
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $push: { "ptProfile.clinicIds": clinic._id }
      },
      { new: true }
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
    const { name, address, contactPhone, coordinates } = req.body;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    // Check if user owns this clinic
    if (clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this clinic" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (contactPhone) updateData.contactPhone = contactPhone;
    
    // Update location if coordinates provided
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      updateData.location = {
        type: "Point",
        coordinates: coordinates
      };
    }

    const updatedClinic = await Clinic.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

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
      return res.status(403).json({ error: "Not authorized to delete this clinic" });
    }

    await Clinic.findByIdAndDelete(id);

    // Remove clinic ID from user's profile
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $pull: { "ptProfile.clinicIds": id }
      },
      { new: true }
    );

    res.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    res.status(500).json({ error: "Failed to delete clinic" });
  }
};
