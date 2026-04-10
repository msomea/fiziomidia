import User from "../../models/User.js";
import Clinic from "../../models/Clinic.js";
import Appointment from "../../models/Appointment.js";
import { CacheService } from "../../utils/redis.js";
import mongoose from "mongoose";
import escapeRegExp from "../../utils/escapeRegExp.js";
import {
  logAdminActivity,
  getAppointmentTargetInfo,
} from "../../middlewares/adminActivityLogger.js";
import { fetchAppointments } from "../adminController.js";

// APPOINTMENTS CONTROLLER
// ============================================

export const getAllAppointments = async (req, res) => {
  try {
    const {
      search = "",
      clinic = "",
      pt = "",
      requester = "",
      status = "",
    } = req.query;

    // Use shared fetchAppointments function
    const appts = await fetchAppointments({
      search,
      clinic,
      pt,
      requester,
      status,
    });

    res.json({ appts });
  } catch (err) {
    console.error("ADMIN appointment query error:", err);
    res.status(500).json({ error: "Server error fetching appointments" });
  }
};

// GET SINGLE APPOINTMENT DETAILS
export const getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid appointment ID" });

    const appointment = await Appointment.findById(id)
      .populate("requester", "fullName email phone")
      .populate("pt", "fullName email phone")
      .populate("clinic", "name address")
      .lean();

    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    return res.json({ success: true, appointment });
  } catch (err) {
    console.error("Admin appointment details error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch appointment details" });
  }
};

//  UPDATE APPOINTMENT (Admin override)
export const updateAppointment = [
  logAdminActivity("APPOINTMENT_UPDATED", getAppointmentTargetInfo),
  async (req, res) => {
    try {
      const { status, date, time, physiotherapist, adminNotes } = req.body;

      const updated = await Appointment.findByIdAndUpdate(
        req.params.id,
        {
          status,
          scheduledDate: date,
          scheduledTime: time,
          adminNotes,
          pt: physiotherapist,
        },
        { new: true },
      );

      // Invalidate admin dashboard cache due to appointment update
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to appointment update`,
      );

      res.json({ success: true, appointment: updated });
    } catch {
      res.status(500).json({ success: false });
    }
  },
];

// DELETE APPOINTMENT
export const deleteAppointment = [
  logAdminActivity("APPOINTMENT_DELETED", getAppointmentTargetInfo),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await Appointment.findByIdAndDelete(id);

      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });

      return res.json({
        success: true,
        message: "Appointment deleted successfully",
      });
    } catch (err) {
      console.error("Admin delete appointment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete appointment" });
    }
  },
];
