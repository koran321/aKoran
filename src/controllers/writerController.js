import { WriterService } from "../services/writerService.js";
import { LoggerService } from "../services/loggerService.js";

export class WriterController {
  static async getAll(req, res) {
    try {
      const writers = await WriterService.getAll();
      res.json(writers);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async create(req, res) {
    try {
      const { password, ...data } = req.body;
      const id = await WriterService.create(data);
      await LoggerService.log("Added Writer", data.name);
      res.json({ success: true, id });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { password, ...data } = req.body;
      console.log("Updating Writer ID:", id, "Data:", JSON.stringify(data));
      const success = await WriterService.update(id, data);
      if (success) {
        await LoggerService.log("Updated Writer", data.name || id);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Writer not found or update failed" });
      }
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await WriterService.delete(id);
      await LoggerService.log("Deleted Writer", id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
}
