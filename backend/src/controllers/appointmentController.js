import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

// POST /api/appointments
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

// GET /api/appointments
export const getAppointments = async (req, res) => {
  const { role } = req.query;
  let filter = {};
  if (req.user.role === "physiotherapist") filter = { pt: req.user._id };
  if (req.user.role === "member") filter = { requester: req.user._id };
  // Admin can pass role param to list all
  if (req.user.role === "admin" && role === "all") filter = {};
  const appts = await Appointment.find(filter)
    .populate("requester pt clinic")
    .sort({ createdAt: -1 });
  res.json({ appts });
};

// PUT /api/appointments/:id (accept/decline/cancel)
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { action, scheduledAt } = req.body;
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ error: "Not found" });

  // Only PT or requester or admin can change status
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
