import express from "express";
import { ClientPortalController } from "../controllers/clientPortalController.js";

const router = express.Router();

router.get("/auth", ClientPortalController.authenticate);
router.get("/dashboard", ClientPortalController.getDashboardData);
router.put("/update-profile", ClientPortalController.updateProfile);

export default router;
