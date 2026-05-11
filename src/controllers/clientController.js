import { ClientService } from "../services/clientService.js";
import { LoggerService } from "../services/loggerService.js";

export class ClientController {
  static async getAll(req, res) {
    try {
      const clients = await ClientService.getAll();
      res.json(clients);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async create(req, res) {
    try {
      const { password, ...data } = req.body;
      const id = await ClientService.create(data);
      await LoggerService.log("Added Client", data.name);
      res.json({ success: true, id });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { password, ...data } = req.body;
      await ClientService.update(id, data);
      await LoggerService.log("Updated Client", data.name || id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await ClientService.delete(id);
      await LoggerService.log("Deleted Client", id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
}
