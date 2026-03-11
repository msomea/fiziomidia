import express from "express";
import {
  getAllClinics,
  getClinicsByPT,
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

// Get clinic by ID
router.get("/:id", getClinicById);

// Get clinics for a specific PT
router.get("/pt/:ptId", getClinicsByPT);

// Create a new clinic (protected)
router.post("/", authenticate, createClinic);

// Update a clinic (protected)
router.put("/:id", authenticate, updateClinic);

// Delete a clinic (protected)
router.delete("/:id", authenticate, deleteClinic);

export default router;
