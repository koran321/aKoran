import express from "express";
import { checkSession, checkPassword } from "../middleware/auth.js";
import { getDb } from "../config/db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/invoices", checkSession, async (req, res) => {
  try {
    const db = await getDb();
    const invoices = await db.collection("invoices").find().sort({ createdAt: -1 }).toArray();
    res.json(invoices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/delete-invoice/:id", checkPassword, async (req, res) => {
  try {
    const db = await getDb();
    await db.collection("invoices").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
