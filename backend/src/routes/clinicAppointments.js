import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import Appointment from "../models/Appointment.js";
import {
  requestClinicAppointment,
  getClinicAvailablePTs,
  getClinicAppointments,
  updateClinicAppointmentStatus,
  getClinicPTsForAssignment,
  getMemberClinicAppointments,
  getClinicAppointmentsForPT,
  getClinicAppointmentById,
} from "../controllers/clinicAppointmentController.js";

const router = express.Router();

// api/clinic-appointments
// Members can request clinic appointments
router.post("/", authenticate, requestClinicAppointment);

// Get available PTs for a clinic (public endpoint for clinic pages)
router.get("/clinic/:clinicId/available-pts", getClinicAvailablePTs);

// Get clinic appointments (clinic owner or admin only)
router.get("/clinic/:clinicId", authenticate, getClinicAppointments);

// Get clinic appointments for PTs who work at the clinic
router.get("/clinic/:clinicId/pt-view", authenticate, getClinicAppointmentsForPT);

// Get member's clinic appointments
router.get("/member/appointments", authenticate, getMemberClinicAppointments);

// Get PTs for assignment (clinic owner or admin only)
router.get("/clinic/:clinicId/pts-for-assignment", authenticate, getClinicPTsForAssignment);

// Get a single clinic appointment by ID
router.get("/:appointmentId", authenticate, getClinicAppointmentById);

// Update clinic appointment status (accept/reject/cancel) - clinic owner or admin only
router.patch("/:appointmentId/status", authenticate, updateClinicAppointmentStatus);

export default router;
