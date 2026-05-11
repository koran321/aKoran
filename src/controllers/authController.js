import { getDb } from "../config/db.js";
import { LoggerService } from "../services/loggerService.js";
import crypto from "crypto";

export class AuthController {
  static async login(req, res) {
    try {
      const { password } = req.body;
      const db = await getDb();
      const admin = await db.collection("security").findOne({ password });

      if (!admin) return res.status(401).json({ error: "Invalid password" });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await db.collection("sessions").insertOne({ token, expiresAt, createdAt: new Date() });
      await LoggerService.log("User Logged In", "Success");

      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async verifySession(req, res) {
    res.json({ valid: true });
  }
}
