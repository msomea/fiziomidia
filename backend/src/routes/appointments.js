import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import {
  requestAppointment,
  getAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";

const router = express.Router();

// Members can request appointments
router.post("/", authenticate, requireRole("member"), requestAppointment);

// PTs/admin can view appointments
router.get(
  "/",
  authenticate,
  requireRole("physiotherapist", "admin"),
  getAppointments
);

// PT/admin can update appointment status
router.put(
  "/:id/status",
  authenticate,
  requireRole("physiotherapist", "admin"),
  updateAppointmentStatus
);

export default router;
