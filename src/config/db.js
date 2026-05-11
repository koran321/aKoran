import { MongoClient } from "mongodb";

const uri = "mongodb+srv://bsnsone:shihabsolidgets@akcluster0.zax3xwc.mongodb.net/ak_process?retryWrites=true&w=majority";

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  console.log("🔌 Connecting to MongoDB...");
  client = new MongoClient(uri, {
    maxPoolSize: 10,
  });
  global._mongoClientPromise = client.connect()
    .then(c => {
      console.log("✅ MongoDB Connected Successfully");
      return c;
    })
    .catch(err => {
      console.error("❌ MongoDB Connection Failed:", err.message);
      throw err;
    });
}

clientPromise = global._mongoClientPromise;

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("ak_process");
}
