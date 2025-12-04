import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import * as admin from "../controllers/adminController.js";

const router = express.Router();
// route /api/admin
// All routes require admin authentication
router.use(authenticate, authenticateAdmin);

// Users Section
router.get("/users", admin.listUsers);
router.get("/users/:id", admin.getUserDetails);
router.put("/users/:id/role", admin.updateUserRole);
router.put("/users/:id/license", admin.updateLicenseStatus);

// Appointments Section
router.get("/appointments", admin.getAllAppointments);
router.get("/appointments/:id", admin.getAppointmentDetails);
router.put("/appointments/:id", admin.updateAppointment);
router.delete("/appointments/:id", admin.deleteAppointment);

// Update / Add sponsorship
router.patch("/subs/:id/sponsorship", admin.updateSponsorship);

// Remove sponsorship
router.patch("/subs/:id/sponsorship/remove", admin.removeSponsorship);

// List all promotions
router.get("/promotions", admin.getAllPromotions);


export default router;
