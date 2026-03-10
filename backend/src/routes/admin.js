import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import * as admin from "../controllers/adminController.js";
import * as modReq from "../controllers/adminForumModController.js";
import { upload } from "../services/uploadService.js";
import {
  getRateLimitStats,
  clearRateLimitData,
} from "../utils/rateLimitMonitor.js";

const router = express.Router();
// route /api/admin
// All routes require admin authentication
router.use(authenticate, authenticateAdmin);

// Users Section
router.get("/users", admin.listUsers);
router.get("/users/:id", admin.getUserDetails);
router.put("/users/:id/role", admin.updateUserRole);
router.put("/users/:id/license", admin.updateLicenseStatus);

// Send email to user
router.post("/users/:id/email", admin.sendEmailToUser);

// Appointments Section
router.get("/appointments", admin.getAllAppointments);
router.get("/appointments/:id", admin.getAppointmentDetails);
router.put("/appointments/:id", admin.updateAppointment);
router.delete("/appointments/:id", admin.deleteAppointment);

// Admin sub and sponsorship
router.get("/subs/:id", admin.getSingleForumSub);
router.put("/subs/:id/sponsorship", upload.single("logo"), admin.updateSponsorship);
router.delete("/subs/:id", admin.deleteSub);

// Moderator Requests
router.get("/forum/mod-requests", modReq.listModRequests);
router.get("/forum/mod-requests/:id", modReq.getModRequestDetail);
router.put("/forum/mod-requests/:id/role", modReq.updateModRequestRole);


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
