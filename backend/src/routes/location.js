import express from "express";
import {
  getRegions,
  getDistricts,
  getWards,
  getStreets,
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/regions", getRegions);
router.get("/districts/:region", getDistricts);
router.get("/wards/:district", getWards);
router.get("/streets/:ward", getStreets);

export default router;
