import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import clientPromise from "./db.js";

const app = express();

app.use(express.json());
app.use(cors());

// 🔁 simple in-memory cache
let cache = {};
const clearCache = () => (cache = {});

// 🔐 PASSWORD CHECK
async function checkPassword(req, res, next) {
  try {
    const { password } = req.body;
    const client = await clientPromise;
    const db = client.db("ak_process");

    const sec = await db.collection("security").findOne();

    if (!sec || sec.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Auth error" });
  }
}

// 📊 DASHBOARD STATS (AGGREGATION → FAST)
app.get("/api/dashboard-stats", async (req, res) => {
  if (cache.stats) return res.json(cache.stats);

  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const [taskStats] = await db.collection("assignment").aggregate([
      {
        $group: {
          _id: null,
          totalTaskValue: { $sum: { $toDouble: "$totalValue" } },
          totalAdvance: { $sum: { $toDouble: "$advancePaid" } },
          pendingTasks: {
            $sum: { $cond: [{ $ne: ["$status", "done"] }, 1, 0] }
          },
          expectedEarnings: {
            $sum: {
              $cond: [
                { $ne: ["$status", "done"] },
                { $subtract: [{ $toDouble: "$totalValue" }, { $toDouble: "$advancePaid" }] },
                0
              ]
            }
          }
        }
      }
    ]).toArray();

    const [expenseStats] = await db.collection("accounts").aggregate([
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: { $toDouble: "$amount" } }
        }
      }
    ]).toArray();

    const stats = {
      totalIn: taskStats?.totalAdvance || 0,
      expectedEarnings: taskStats?.expectedEarnings || 0,
      totalExpenses: expenseStats?.totalExpenses || 0,
      netBalance: (taskStats?.totalAdvance || 0) - (expenseStats?.totalExpenses || 0),
      pendingTasks: taskStats?.pendingTasks || 0
    };

    cache.stats = stats;
    res.json(stats);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 TASKS (PAGINATED + $LOOKUP POPULATE)
app.get("/api/tasks", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    const key = `tasks_${page}_${limit}`;
    if (cache[key]) return res.json(cache[key]);

    const client = await clientPromise;
    const db = client.db("ak_process");

    const skip = (page - 1) * limit;

    // Use Aggregation to mimic Mongoose's .populate('client')
    const tasks = await db.collection("assignment").aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientData"
        }
      },
      {
        $addFields: {
          client: { $arrayElemAt: ["$clientData", 0] } // Convert array to object
        }
      },
      { $project: { clientData: 0 } } // Clean up the temporary array
    ]).toArray();

    const total = await db.collection("assignment").countDocuments();

    const result = {
      data: tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };

    cache[key] = result;
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ ADD TASK
app.post("/api/add-task", checkPassword, async (req, res) => {
  try {
    const { title, details, workType, clientId, clientName, clientPhone, clientUniversity, deadline, totalValue, advancePaid, assignedTo } = req.body;
    const client = await clientPromise;
    const db = client.db("ak_process");

    let finalClientId = clientId && clientId !== 'new' ? new ObjectId(clientId) : null;

    // Dynamically create client if "new" is selected
    if (clientId === 'new' && (clientName || clientPhone)) {
      const newClient = await db.collection("clients").insertOne({ 
        name: clientName || "Unnamed Client", 
        phone: clientPhone || "", 
        university: clientUniversity || "",
        createdAt: new Date(), updatedAt: new Date()
      });
      finalClientId = newClient.insertedId;
    }

    const task = await db.collection("assignment").insertOne({
      title, details: details || "", workType, client: finalClientId, 
      deadline: deadline || null, totalValue: Number(totalValue) || 0, 
      advancePaid: Number(advancePaid) || 0, assignedTo, status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    clearCache();
    res.json(task);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ UPDATE TASK
app.put("/api/update-task/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const updates = { ...req.body };
    delete updates.password; // Do not save the auth token to the db
    if (updates.deadline === "") updates.deadline = null;

    let finalClientId = updates.clientId;
    if (finalClientId === 'new') {
      if (updates.clientName || updates.clientPhone) {
        const newClient = await db.collection("clients").insertOne({ 
          name: updates.clientName || "Unnamed Client", 
          phone: updates.clientPhone || "", 
          university: updates.clientUniversity || "",
          createdAt: new Date(), updatedAt: new Date()
        });
        finalClientId = newClient.insertedId;
      } else { finalClientId = null; }
    } else if (finalClientId) {
      finalClientId = new ObjectId(finalClientId);
    }

    if (finalClientId !== undefined) updates.client = finalClientId || null;
    delete updates.clientId; delete updates.clientName; delete updates.clientPhone; delete updates.clientUniversity;
    
    // Ensure numbers are cast properly
    if (updates.totalValue !== undefined) updates.totalValue = Number(updates.totalValue);
    if (updates.advancePaid !== undefined) updates.advancePaid = Number(updates.advancePaid);

    const result = await db.collection("assignment").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    clearCache();
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ DELETE TASK
app.delete("/api/delete-task/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    await db.collection("assignment").deleteOne({ _id: new ObjectId(req.params.id) });

    clearCache();
    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👥 CLIENTS
app.get("/api/clients", async (req, res) => {
  if (cache.clients) return res.json(cache.clients);

  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const clients = await db.collection("clients")
      .find({})
      .sort({ name: 1 })
      .toArray();

    cache.clients = clients;
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add-client", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const { name, phone, university } = req.body;
    const result = await db.collection("clients").insertOne({
      name, phone, university, createdAt: new Date(), updatedAt: new Date()
    });

    clearCache();
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/update-client/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const { name, phone, university } = req.body;
    const result = await db.collection("clients").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, phone, university, updatedAt: new Date() } }
    );

    clearCache();
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 💰 ACCOUNTS (Expenses)
app.get("/api/accounts", async (req, res) => {
  if (cache.accounts) return res.json(cache.accounts);

  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const data = await db.collection("accounts")
      .find({})
      .sort({ date: -1 })
      .toArray();

    cache.accounts = data;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add-account", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const { category, amount, description } = req.body;
    const result = await db.collection("accounts").insertOne({
      category, amount: Number(amount), description, date: new Date(), createdAt: new Date()
    });

    clearCache();
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/delete-account/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    await db.collection("accounts").deleteOne({ _id: new ObjectId(req.params.id) });

    clearCache();
    res.json({ message: "Deleted" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default app;
