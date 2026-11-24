import express from "express";
import { getTeamMembers } from "../controllers/teamMemberController.js";

const router = express.Router();

router.get("/", getTeamMembers);

export default router;
