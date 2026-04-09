import express from "express";
import { getHomePageData, clearHomePageCache } from "../controllers/homePageController.js";

const router = express.Router();

// GET /api/home-page/data
router.get("/data", getHomePageData);

// DELETE /api/home-page/cache
router.delete("/cache", clearHomePageCache);

export default router;
