import { getDb } from "../config/db.js";

export class LoggerService {
  static async log(action, details = "") {
    try {
      const db = await getDb();
      await db.collection("logs").insertOne({
        action,
        details,
        timestamp: new Date()
      });
    } catch (err) {
      console.error("Logging failed:", err);
    }
  }

  static async getLogs(limit = 10) {
    const db = await getDb();
    return db.collection("logs").find().sort({ timestamp: -1 }).limit(limit).toArray();
  }
}
