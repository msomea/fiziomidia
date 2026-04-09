import express from "express";
import {
  getAllClinics,
  getClinicsByUser,
  getClinicById,
  createClinic,
  updateClinic,
  deleteClinic,
  getClinicsPTWork,
  getClinicOwnedByPT,
} from "../controllers/clinicController.js";
import {
  createPTRequest,
  getPTRequests,
  respondToPTRequest,
  cancelPTRequest,
  getMyPTRequests,
} from "../controllers/ptRequestController.js";
import { authenticate } from "../middlewares/auth.js";
import { upload } from "../services/uploadService.js";

const router = express.Router();
// api/clinics
// Get all clinics (admin use)
router.get("/", getAllClinics);

// Create a new clinic (protected)
router.post("/", authenticate, upload.single("clinic"), createClinic);

// Get my clinics owned by PT
router.get("/owned-by-pt/:ptId", authenticate, getClinicOwnedByPT);

// Get my PT requests (PT only) - MUST come before /:clinicId/requests
router.get("/my-requests", authenticate, getMyPTRequests);

// Get clinics that specific PT works
router.get("/pt-work/:ptId", getClinicsPTWork);


// Get clinics for a specific user (universal) (MUST come before /:id)
router.get("/user/:userId", getClinicsByUser);

// PT Request endpoints
// Create PT request (clinic owner)
router.post("/:clinicId/requests", authenticate, createPTRequest);

// Get PT requests for a clinic (clinic owner)
router.get("/:clinicId/requests", authenticate, getPTRequests);

// Respond to PT request (PT only)
router.put("/requests/:requestId/respond", authenticate, respondToPTRequest);

// Cancel PT request (clinic owner only)
router.delete("/requests/:requestId", authenticate, cancelPTRequest);

// Update a clinic (protected)
router.put("/:id", authenticate, upload.single("clinic"), updateClinic);

// Delete a clinic (protected)
router.delete("/:id", authenticate, deleteClinic);

// Get clinic by ID (MUST come last to avoid conflicts)
router.get("/:id", getClinicById);


export default router;
