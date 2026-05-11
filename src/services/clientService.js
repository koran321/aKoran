import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";

export class ClientService {
  static async getAll() {
    const db = await getDb();
    return db.collection("clients").aggregate([
      {
        $addFields: {
          _id: { $toString: "$_id" }
        }
      }
    ]).toArray();
  }

  static async create(clientData) {
    const db = await getDb();
    const result = await db.collection("clients").insertOne({
      ...clientData,
      createdAt: new Date()
    });
    return result.insertedId;
  }

  static async update(id, clientData) {
    if (!ObjectId.isValid(id)) return false;
    const db = await getDb();
    const result = await db.collection("clients").updateOne(
      { _id: new ObjectId(id) },
      { $set: clientData }
    );
    return result.acknowledged;
  }

  static async delete(id) {
    const db = await getDb();
    await db.collection("clients").deleteOne({ _id: new ObjectId(id) });
  }
}
