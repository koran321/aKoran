import { ExpenseService } from "../services/expenseService.js";
import { LoggerService } from "../services/loggerService.js";

export class ExpenseController {
  static async getAll(req, res) {
    try {
      const expenses = await ExpenseService.getAll();
      res.json(expenses);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async create(req, res) {
    try {
      const { password, ...data } = req.body;
      const id = await ExpenseService.create(data);
      await LoggerService.log("Logged Expense", `${data.category}: ${data.amount}`);
      res.json({ success: true, id });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await ExpenseService.delete(id);
      await LoggerService.log("Deleted Expense", id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
}
