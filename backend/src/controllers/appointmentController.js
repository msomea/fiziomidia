import Appointment from "../models/Appointment.js";
import Clinic from "../models/Clinic.js";
// Request a new appointment
export const requestAppointment = async (req, res) => {
  const { ptId, clinicId, scheduledAt, notes, durationMinutes } = req.body;
  const appointment = new Appointment({
    requester: req.user._id,
    pt: ptId,
    clinic: clinicId,
    scheduledAt,
    notes,
    durationMinutes,
  });
  await appointment.save();
  res.status(201).json({ appointment });
};

// Get appointments
export const getAppointments = async (req, res) => {
  try {
    const { ptId, limit } = req.query;
    // Ensure req.user exists
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    let filter = {};

    if (req.user.role === "physiotherapist") {
      filter.pt = req.user._id;
    } else if (req.user.role === "member") {
      filter.requester = req.user._id;
    } else if (req.user.role === "admin" && ptId) {
      filter.pt = ptId;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const appts = await Appointment.find(filter)
      .populate("requester pt clinic")
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 3);

    res.json({ appointments: appts });
  } catch (err) {
    console.error("❌ Appointments API error:", err.message, err.stack);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};



// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { action, scheduledAt } = req.body;
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ error: "Not found" });

  const userId = req.user._id.toString();
  if (
    req.user.role !== "admin" &&
    req.user._id.toString() !== appt.pt.toString() &&
    req.user._id.toString() !== appt.requester.toString()
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (action === "accept") {
    appt.status = "accepted";
    if (scheduledAt) appt.scheduledAt = scheduledAt;
  } else if (action === "decline") {
    appt.status = "declined";
  } else if (action === "cancel") {
    appt.status = "cancelled";
  } else if (action === "complete") {
    appt.status = "completed";
  }
  await appt.save();
  res.json({ appointment: appt });
};

// Get a single appointment
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id).populate("requester pt clinic");
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    const userId = req.user._id.toString();
    if (
      req.user.role !== "admin" &&
      userId !== appt.pt.toString() &&
      userId !== appt.requester.toString()
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ appointment: appt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get appointments by member
export const getAppointmentsByMember = async (req, res) => {
  try {
    const memberId = req.params.id;

    // Only allow admin or the member themselves
    if (req.user.role !== "admin" && req.user._id.toString() !== memberId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const appts = await Appointment.find({ requester: memberId })
      .populate("requester pt clinic")
      .sort({ createdAt: -1 });

    return res.status(200).json({ appts });
  } catch (err) {
    console.error("❌ Failed to fetch data", err);
    return res.status(500).json({ error: err.message });
  }
};

// Delete an appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    // Only requester, PT, or admin can delete
    const userId = req.user._id.toString();
    if (
      req.user.role !== "admin" &&
      userId !== appt.pt.toString() &&
      userId !== appt.requester.toString()
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await appt.deleteOne();
    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
