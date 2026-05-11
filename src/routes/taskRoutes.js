import express from "express";
import { TaskController } from "../controllers/taskController.js";
import { checkSession, checkPassword } from "../middleware/auth.js";

const router = express.Router();

router.get("/tasks", checkSession, TaskController.getAllTasks);
router.get("/track-task/:id", TaskController.getTaskById);
router.post("/add-task", checkPassword, TaskController.createTask);
router.put("/update-task/:id", checkPassword, TaskController.updateTask);
router.delete("/delete-task/:id", checkPassword, TaskController.deleteTask);

export default router;
