import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";

export class ExpenseService {
  static async getAll() {
    const db = await getDb();
    return db.collection("accounts").find().sort({ date: -1 }).toArray();
  }

  static async create(expenseData) {
    const db = await getDb();
    const result = await db.collection("accounts").insertOne({
      ...expenseData,
      createdAt: new Date()
    });
    return result.insertedId;
  }

  static async delete(id) {
    const db = await getDb();
    await db.collection("accounts").deleteOne({ _id: new ObjectId(id) });
  }
}
