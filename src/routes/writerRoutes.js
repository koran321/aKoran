import express from "express";
import { WriterController } from "../controllers/writerController.js";
import { StatsController } from "../controllers/statsController.js";
import { checkSession, checkPassword } from "../middleware/auth.js";

const router = express.Router();

router.get("/writers", checkSession, WriterController.getAll);
router.post("/add-writer", checkPassword, WriterController.create);
router.put("/update-writer/:id", checkPassword, WriterController.update);
router.delete("/delete-writer/:id", checkPassword, WriterController.delete);
router.get("/writer-stats", checkSession, StatsController.getWriterStats);

export default router;
