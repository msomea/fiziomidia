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

// PUBLIC
router.get("/", getSponsoredProducts);

// ADMIN ONLY
router.post("/", authenticate, upload.single("image"), createSponsoredProduct);
router.put("/:id", authenticate,  upload.single("image"), updateSponsoredProduct);
router.delete("/:id", authenticate, deleteSponsoredProduct);

export default router;
