import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import * as admin from "../controllers/adminController.js";

const router = express.Router();
// route /api/admin
// All routes require admin authentication
router.use(authenticate, authenticateAdmin);

// List all users (admin only)
router.get("/users", admin.listUsers);

// admin can all view appointments
router.get("/appointments", admin.getAllAppointments);

// Update / Add sponsorship
router.patch("/subs/:id/sponsorship", admin.updateSponsorship);

// Remove sponsorship
router.patch("/subs/:id/sponsorship/remove", admin.removeSponsorship);

// List all promotions
router.get("/promotions", admin.getAllPromotions);


export default router;
