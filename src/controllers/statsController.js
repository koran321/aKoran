import { getDb } from "../config/db.js";

export class StatsController {
  static async getDashboardStats(req, res) {
    try {
      const db = await getDb();
      const statsResults = await db.collection("assignment").aggregate([
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
            totalEarned: { $sum: { $convert: { input: "$advance", to: "double", onError: 0 } } },
            expectedEarnings: { $sum: { $convert: { input: "$total", to: "double", onError: 0 } } }
          }
        }
      ]).toArray();

      const stats = statsResults[0] || {
        totalTasks: 0,
        completedTasks: 0,
        totalEarned: 0,
        expectedEarnings: 0
      };

      const expenses = await db.collection("accounts").aggregate([
        { $group: { _id: null, total: { $sum: { $convert: { input: "$amount", to: "double", onError: 0 } } } } }
      ]).toArray();

      const totalExpenses = expenses[0]?.total || 0;
      
      res.json({
        ...stats,
        totalExpenses,
        netBalance: (stats.totalEarned || 0) - totalExpenses
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getWriterStats(req, res) {
    try {
      const db = await getDb();
      const stats = await db.collection("assignment").aggregate([
        {
          $group: {
            _id: "$assignee",
            activeWorkload: { $sum: { $cond: [{ $ne: ["$status", "done"] }, 1, 0] } },
            totalEarnings: { $sum: { $convert: { input: "$total", to: "double", onError: 0 } } },
            pendingPayments: { 
              $sum: { 
                $subtract: [
                  { $convert: { input: "$total", to: "double", onError: 0 } },
                  { $convert: { input: "$advance", to: "double", onError: 0 } }
                ]
              } 
            }
          }
        }
      ]).toArray();
      res.json(stats || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
