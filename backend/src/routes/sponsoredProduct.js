import express from "express";
import {
  getSponsoredProducts,
  createSponsoredProduct,
  updateSponsoredProduct,
  deleteSponsoredProduct
} from "../controllers/sponsoredProductController.js";

import { upload } from "../services/uploadService.js";    // if uploading images

const router = express.Router();

// PUBLIC
router.get("/", getSponsoredProducts);

// ADMIN ONLY
router.post("/", upload.single("image"), createSponsoredProduct);
router.put("/:id",  upload.single("image"), updateSponsoredProduct);
router.delete("/:id", deleteSponsoredProduct);

export default router;
