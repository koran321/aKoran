import express from "express";
import { AuthController } from "../controllers/authController.js";
import { checkSession, checkPassword } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", AuthController.login);
router.get("/verify-session", checkSession, AuthController.verifySession);
router.post("/verify-phone-password", checkPassword, (req, res) => res.json({ success: true }));
router.post("/verify-invoice-password", checkPassword, (req, res) => res.json({ success: true }));

export default router;
