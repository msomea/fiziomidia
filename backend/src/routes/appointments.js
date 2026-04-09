import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import {
  requestAppointment,
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentById,
  getAppointmentsByMember,
} from "../controllers/appointmentController.js";

const router = express.Router();
// api/appointments
// Members can request appointments
router.post("/", authenticate, requestAppointment);

// Get appointments by member (MUST come before /:id)
router.get("/member/:id", authenticate, requireRole("member", "admin"), getAppointmentsByMember);

// PTs/admin can view appointments
router.get("/", authenticate, getAppointments);

// Get a single appointment by ID (MUST come last)
router.get("/:id", authenticate, getAppointmentById);

// PT/admin can update appointment status
router.patch("/:id/status", authenticate, requireRole("physiotherapist", "admin"), updateAppointmentStatus);

// Requester, PT, or admin can delete an appointment
router.delete("/:id", authenticate, deleteAppointment);


export default router;
