import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import * as admin from "../controllers/adminController.js";
import { upload } from "../services/uploadService.js";

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

// Admin sub and sponsorship
router.get("/subs/:id", admin.getSingleForumSub);
router.put("/subs/:id/sponsorship", upload.single("logo"), admin.updateSponsorship);
router.delete("/subs/:id", admin.deleteSub);

// Admin PT Promotions
router.get("/promotions", admin.getAllPromotions);
router.get("/promotions/:id", admin.getAdminPromotion);
router.put("/promotions/:id", admin.updateAdminPromotion);
router.delete("/promotions/:id", admin.deleteAdminPromotion);

//Admin Sponsored Products
router.get("/sponsored-products", admin.getAllSponsoredProducts);
router.post("/sponsored-products", upload.single("product"), admin.createSponsoredProduct);
router.get("/sponsored-products/:id", admin.getSponsoredProductById);
router.put("/sponsored-products/:id", upload.single("product"), admin.updateSponsoredProduct);
router.delete("/sponsored-products/:id", admin.deleteSponsoredProduct);

export default router;
