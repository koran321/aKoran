import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";

export class WriterService {
  static async getAll() {
    const db = await getDb();
    return db.collection("writers").find().toArray();
  }

  static async create(writerData) {
    const db = await getDb();
    const result = await db.collection("writers").insertOne({
      ...writerData,
      createdAt: new Date()
    });
    return result.insertedId;
  }

  static async update(id, writerData) {
    if (!ObjectId.isValid(id)) return false;
    console.log(`[WriterService.update] ID: ${id}, Data to set:`, JSON.stringify(writerData));
    const db = await getDb();
    const result = await db.collection("writers").updateOne(
      { _id: new ObjectId(id) },
      { $set: writerData }
    );
    return result.acknowledged;
  }

  static async delete(id) {
    const db = await getDb();
    await db.collection("writers").deleteOne({ _id: new ObjectId(id) });
  }
}
