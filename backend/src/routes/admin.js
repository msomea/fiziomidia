import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import * as userController from "../controllers/admin/adminUserController.js";
import * as appointmentController from "../controllers/admin/adminAppointmentController.js";
import * as promotionController from "../controllers/admin/adminPromotionController.js";
import * as sponsorshipController from "../controllers/admin/adminSponsorshipController.js";
import * as productController from "../controllers/admin/adminSponsoredProductController.js";
import * as monitoringController from "../controllers/admin/adminMonitoringController.js";
import * as modReq from "../controllers/admin/adminForumModController.js";
import { upload } from "../services/uploadService.js";
import { getDashboardData } from "../controllers/adminController.js";
import {
  getRateLimitStats,
  clearRateLimitData,
} from "../utils/rateLimitMonitor.js";
import { limiters } from "../utils/rateLimiter.js";

const router = express.Router();
// route /api/admin
// All routes require admin authentication
// router.use(authenticate, authenticateAdmin, limiters.admin);

// Users Section
router.get("/users", userController.listUsers);
router.get("/users/:id", userController.getUserDetails);
router.put("/users/:id/role", userController.updateUserRole);
router.put("/users/:id/license", userController.updateLicenseStatus);

// Send email to user
router.post("/users/:id/email", userController.sendEmailToUser);

// Appointments Section
router.get("/appointments", appointmentController.getAllAppointments);
router.get("/appointments/:id", appointmentController.getAppointmentDetails);
router.put("/appointments/:id", appointmentController.updateAppointment);
router.delete("/appointments/:id", appointmentController.deleteAppointment);

// Admin sub and sponsorship
router.get("/subs/:id", sponsorshipController.getSingleForumSub);
router.put(
  "/subs/:id/sponsorship",
  upload.single("logo"),
  sponsorshipController.updateSponsorship,
);
router.delete("/subs/:id", sponsorshipController.deleteSub);

// Moderator Requests
router.get("/forum/mod-requests", modReq.listModRequests);
router.get("/forum/mod-requests/:id", modReq.getModRequestDetail);
router.put("/forum/mod-requests/:id/role", modReq.updateModRequestRole);


// Admin PT Promotions
router.get("/promotions", promotionController.getAllPromotions);
router.get("/promotions/:id", promotionController.getAdminPromotion);
router.put("/promotions/:id", promotionController.updateAdminPromotion);
router.delete("/promotions/:id", promotionController.deleteAdminPromotion);

//Admin Sponsored Products
router.get("/sponsored-products", productController.getAllSponsoredProducts);
router.post(
  "/sponsored-products",
  upload.single("product"),
  productController.createSponsoredProduct,
);
router.get(
  "/sponsored-products/:id",
  productController.getSponsoredProductById,
);
router.put(
  "/sponsored-products/:id",
  upload.single("product"),
  productController.updateSponsoredProduct,
);
router.delete(
  "/sponsored-products/:id",
  productController.deleteSponsoredProduct,
);

// Admin Monitoring Routes
router.get("/monitoring/logs", monitoringController.getAdminActivityLogs);
router.get("/monitoring/stats", monitoringController.getAdminStats);

// Consolidated Dashboard Route
router.get("/dashboard", getDashboardData);

// Rate Limit Monitoring
router.get("/rate-limits/stats", async (req, res) => {
  try {
    const stats = await getRateLimitStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get rate limit stats",
    });
  }
});

router.post("/rate-limits/clear", async (req, res) => {
  try {
    const { pattern } = req.body;
    const clearedCount = await clearRateLimitData(pattern || "rl:*");
    res.json({
      success: true,
      message: `Cleared ${clearedCount} rate limit keys`,
      clearedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clear rate limit data",
    });
  }
});



export default router;
