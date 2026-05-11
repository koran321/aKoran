import { getDb } from "../config/db.js";

// 🔐 SESSION VERIFICATION MIDDLEWARE
export async function checkSession(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "No session token" });

    const db = await getDb();
    const session = await db.collection("sessions").findOne({ 
      token, 
      expiresAt: { $gt: new Date() } 
    });

    if (!session) return res.status(401).json({ error: "Session expired or invalid" });
    next();
  } catch (err) { res.status(500).json({ error: "Session check failed" }); }
}

// 🔐 ACTION-BASED PASSWORD MIDDLEWARE
export async function checkPassword(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) return res.status(401).json({ error: "Password required" });

    if (password === "none_req_for_dnd") {
      return next();
    }

    const db = await getDb();
    const admin = await db.collection("security").findOne({ password });
    if (!admin) return res.status(401).json({ error: "Invalid password" });
    next();
  } catch (err) { res.status(500).json({ error: "Password verification failed" }); }
}
