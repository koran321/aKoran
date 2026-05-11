import express from "express";
import { ExpenseController } from "../controllers/expenseController.js";
import { checkSession, checkPassword } from "../middleware/auth.js";

const router = express.Router();

router.get("/accounts", checkSession, ExpenseController.getAll);
router.post("/add-account", checkPassword, ExpenseController.create);
router.put("/update-account/:id", checkPassword, (req, res) => res.json({ success: true })); // Dummy for now
router.delete("/delete-account/:id", checkPassword, ExpenseController.delete);

export default router;
