import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";

export class TaskService {
  static async getAll(query = {}, sort = { deadline: 1 }) {
    const db = await getDb();
    return db.collection("assignment").aggregate([
      { $match: query },
      { $sort: sort },
      {
        $lookup: {
          from: "clients",
          let: { clientId: "$client" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $or: [
                    { $eq: ["$_id", "$$clientId"] },
                    { $eq: ["$_id", { $toObjectId: "$$clientId" }] }
                  ] 
                } 
              } 
            }
          ],
          as: "clientData"
        }
      },
      {
        $addFields: {
          client: { $arrayElemAt: ["$clientData", 0] }
        }
      },
      {
        $addFields: {
          "client._id": { $toString: "$client._id" },
          "clientName": "$client.name",
          "clientUniversity": "$client.university",
          "_id": { $toString: "$_id" }
        }
      },
      { $project: { clientData: 0 } }
    ]).toArray();
  }

  static async getById(idOrShort) {
    const db = await getDb();
    
    // Remove leading # and trim
    const cleanId = idOrShort.replace(/^#/, "").trim();
    
    // Check if it's a valid ObjectId first, otherwise treat as orderId
    const isObjectId = cleanId.length === 24 && /^[0-9a-fA-F]+$/.test(cleanId);
    const matchQuery = isObjectId 
      ? { _id: new ObjectId(cleanId) } 
      : { orderId: cleanId.toUpperCase() };

    const tasks = await db.collection("assignment").aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "clients",
          let: { clientId: "$client" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $or: [
                    { $eq: ["$_id", "$$clientId"] },
                    { $eq: ["$_id", { $toObjectId: "$$clientId" }] }
                  ] 
                } 
              } 
            }
          ],
          as: "clientData"
        }
      },
      {
        $addFields: {
          client: { $arrayElemAt: ["$clientData", 0] },
          _id: { $toString: "$_id" }
        }
      },
      {
        $addFields: {
          "client._id": { $toString: "$client._id" },
          "clientName": "$client.name",
          "clientUniversity": "$client.university"
        }
      },
      { $project: { clientData: 0 } }
    ]).toArray();
    return tasks[0];
  }

  static async create(taskData) {
    const db = await getDb();
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await db.collection("assignment").insertOne({
      ...taskData,
      orderId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  }

  static async update(id, taskData) {
    const db = await getDb();
    await db.collection("assignment").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...taskData, updatedAt: new Date() } }
    );
  }

  static async delete(id) {
    const db = await getDb();
    await db.collection("assignment").deleteOne({ _id: new ObjectId(id) });
  }
}
