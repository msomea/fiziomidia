import express from "express";
import {
  getAllClinics,
  getClinicsByPT,
  getClinicsByUser,
  getClinicById,
  createClinic,
  updateClinic,
  deleteClinic,
} from "../controllers/clinicController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();
// api/clinics
// Get all clinics (admin use)
router.get("/", getAllClinics);

// Get clinics for a specific PT (MUST come before /:id)
router.get("/pt/:ptId", getClinicsByPT);

// Get clinics for a specific user (universal) (MUST come before /:id)
router.get("/user/:userId", getClinicsByUser);

// Get my clinics (authenticated user)
router.get("/my-clinics", authenticate, getClinicsByUser);

// Get clinic by ID (MUST come last to avoid conflicts)
router.get("/:id", getClinicById);

// Create a new clinic (protected)
router.post("/", authenticate, createClinic);

// Update a clinic (protected)
router.put("/:id", authenticate, updateClinic);

// Delete a clinic (protected)
router.delete("/:id", authenticate, deleteClinic);

export default router;
