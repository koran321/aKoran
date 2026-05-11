import { MongoClient, ObjectId } from "mongodb";
const uri = "mongodb+srv://bsnsone:shihabsolidgets@akcluster0.zax3xwc.mongodb.net/ak_process?retryWrites=true&w=majority";

async function migrate() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("ak_process");
    const tasks = await db.collection("assignment").find({ orderId: { $exists: false } }).toArray();
    
    console.log(`Migrating ${tasks.length} tasks...`);
    
    for (const task of tasks) {
      const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await db.collection("assignment").updateOne(
        { _id: task._id },
        { $set: { orderId: shortId } }
      );
    }
    
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

migrate();
