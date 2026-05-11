import { ClientService } from "../services/clientService.js";
import { TaskService } from "../services/taskService.js";

export class ClientPortalController {
  static async authenticate(req, res) {
    try {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const cleanInputPhone = phone.replace(/\D/g, "");
      
      // Find client by phone number
      const clients = await ClientService.getAll();
      const client = clients.find(c => {
        const cPhone = (c.phone || "").replace(/\D/g, "");
        return cPhone.endsWith(cleanInputPhone) && cleanInputPhone.length >= 10;
      });

      if (!client) {
        return res.status(404).json({ error: "No client found with this phone number." });
      }

      res.json({
        success: true,
        token: client._id,
        clientId: client._id
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getDashboardData(req, res) {
    try {
      const clientId = req.headers.authorization;
      if (!clientId) return res.status(401).json({ error: "Unauthorized" });

      // Fetch client profile
      const clients = await ClientService.getAll();
      const client = clients.find(c => c._id === clientId);
      if (!client) return res.status(404).json({ error: "Client profile not found" });

      // Fetch all tasks for this client
      const allTasks = await TaskService.getAll();
      const clientTasks = allTasks.filter(t => (t.client?._id === clientId) || (t.client === clientId));

      res.json({
        profile: client,
        tasks: clientTasks
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const clientId = req.headers.authorization;
      if (!clientId) return res.status(401).json({ error: "Unauthorized" });

      const updates = req.body;
      // For security, only allow updating specific fields
      const allowedFields = ["image", "imageLink"];
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) filteredUpdates[key] = updates[key];
      });

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const success = await ClientService.update(clientId, filteredUpdates);
      if (success) {
        res.json({ success: true, message: "Profile updated successfully" });
      } else {
        res.status(404).json({ error: "Client not found" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
