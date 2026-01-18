import express from "express";
import {
  getSponsoredProducts,
  createSponsoredProduct,
  updateSponsoredProduct,
  deleteSponsoredProduct
} from "../controllers/sponsoredProductController.js";
import { authenticate } from "../middlewares/auth.js";
import { upload } from "../services/uploadService.js";    // if uploading images

const router = express.Router();
// /api/sponsored-products
// PUBLIC
router.get("/", getSponsoredProducts);

// Authenticated User routes
router.post("/", authenticate, upload.single("product"), createSponsoredProduct);
router.put("/:id", authenticate,  upload.single("product"), updateSponsoredProduct);
router.delete("/:id", authenticate, deleteSponsoredProduct);

export default router;
