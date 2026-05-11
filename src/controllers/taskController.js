import { TaskService } from "../services/taskService.js";
import { LoggerService } from "../services/loggerService.js";

export class TaskController {
  static async getAllTasks(req, res) {
    try {
      const tasks = await TaskService.getAll();
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTaskById(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "ID is required" });
      }
      const task = await TaskService.getById(id);
      if (!task) return res.status(404).json({ error: "Order not found" });
      res.json(task);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createTask(req, res) {
    try {
      const { password, ...taskData } = req.body;
      const id = await TaskService.create(taskData);
      await LoggerService.log("Created Task", taskData.title);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateTask(req, res) {
    try {
      const { id } = req.params;
      const { password, ...taskData } = req.body;
      await TaskService.update(id, taskData);
      await LoggerService.log("Updated Task", taskData.title || id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteTask(req, res) {
    try {
      const { id } = req.params;
      await TaskService.delete(id);
      await LoggerService.log("Deleted Task", id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
