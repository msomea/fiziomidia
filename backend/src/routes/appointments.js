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

// Members can request appointments
router.post("/", authenticate, requireRole("member"), requestAppointment);

// Get a single appointment by ID (requester, PT, or admin)
router.get("/:id", authenticate, getAppointmentById);

// PTs/admin can view appointments
router.get("/", authenticate, requireRole("physiotherapist", "admin"), getAppointments);

// PT/admin can update appointment status
router.put("/:id/status", authenticate, requireRole("physiotherapist", "admin"), updateAppointmentStatus);

// Requester, PT, or admin can delete an appointment
router.delete("/:id", authenticate, deleteAppointment);

// Get appointments by member
router.get("/member/:id", authenticate, getAppointmentsByMember);

export default router;
