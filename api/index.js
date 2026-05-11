import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import clientPromise from "./db.js";

const app = express();

app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 📝 LOGGING UTILITY
async function addLog(action, details) {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    await db.collection("logs").insertOne({
      action,
      details,
      timestamp: new Date()
    });
  } catch (err) { console.error("Logging error:", err); }
}

// 🔐 PASSWORD CHECK MIDDLEWARE
async function checkPassword(req, res, next) {
  try {
    const { password } = req.body;
    
    // Bypass password check for silent drag & drop status updates
    if (password === "none_req_for_dnd") return next();

    const client = await clientPromise;
    const db = client.db("ak_process");

    // Authenticate specifically against the MAIN password ID ("1is2")
    const sec = await db.collection("security").findOne({ 
      _id: new ObjectId("69f9a082ac09e7d644f93655") 
    });

    if (!sec || sec.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Auth error" });
  }
}

// 📱 VERIFY PHONE REVEAL PASSWORD ENDPOINT
app.post("/api/verify-phone-password", async (req, res) => {
  try {
    const { password } = req.body;
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    // Authenticate specifically against the PHONE unlock password ID ("cl11")
    const sec = await db.collection("security").findOne({
      _id: new ObjectId("69fb5dfa5cb79cf60ceb14e2") 
    });

    if (!sec || sec.password !== password) {
      return res.status(401).json({ message: "Invalid phone reveal password!" });
    }
    res.json({ message: "Authenticated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === PASSWORD AUTHENTICATION MIDDLEWARE FOR INVOICES ===
app.post("/api/verify-invoice-password", async (req, res) => {
  try {
    const { password } = req.body;
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    // Authenticate specifically against the Invoice Download password ID ("inv11")
    const sec = await db.collection("security").findOne({
      _id: new ObjectId("69ff93338ccd1d4ba50dd03d") 
    });

    if (!sec || sec.password !== password) {
      return res.status(401).json({ message: "Invalid invoice download password!" });
    }
    res.json({ message: "Authenticated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 DASHBOARD STATS (AGGREGATION → FAST)
app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const [taskStats] = await db.collection("assignment").aggregate([
      {
        $group: {
          _id: null,
          totalTaskValue: { $sum: { $toDouble: "$totalValue" } },
          totalAdvance: { $sum: { $toDouble: "$advancePaid" } },
          totalBonus: { $sum: { $toDouble: { $ifNull: ["$bonus", 0] } } },
          pendingTasks: {
            $sum: { $cond: [{ $ne: ["$status", "done"] }, 1, 0] }
          },
          expectedEarnings: {
            $sum: {
              $cond: [
                { $ne: ["$status", "done"] },
                { $subtract: [
                    { $add: [{ $toDouble: "$totalValue" }, { $toDouble: { $ifNull: ["$bonus", 0] } }] }, 
                    { $toDouble: "$advancePaid" }
                ]},
                0
              ]
            }
          }
        }
      }
    ]).toArray();

    const [expenseStats] = await db.collection("accounts").aggregate([
      { $match: { type: { $ne: "income" } } },
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

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 PUBLIC TASK TRACKING (For Client Portal)
app.get("/api/track-task/:id", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const task = await db.collection("assignment").aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
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
          clientName: { $ifNull: [{ $arrayElemAt: ["$clientData.name", 0] }, "Internal"] }
        }
      },
      { $project: { title: 1, status: 1, deadline: 1, clientName: 1 } }
    ]).next();

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ ADD TASK
app.post("/api/add-task", checkPassword, async (req, res) => {
  try {
    const { title, details, link, driveLink, revisionCount, workType, clientId, clientName, clientPhone, clientUniversity, clientCountry, clientProgram, clientSubject, deadline, totalValue, advancePaid, bonus, assignedTo, status, writerPay } = req.body;
    const client = await clientPromise;
    const db = client.db("ak_process");

    let finalClientId = clientId && clientId !== 'new' ? new ObjectId(clientId) : null;

    // Dynamically create client if "new" is selected
    if (clientId === 'new' && (clientName || clientPhone)) {
      const newClient = await db.collection("clients").insertOne({ 
        name: clientName || "Unnamed Client", 
        phone: clientPhone || "", 
        university: clientUniversity || "",
        country: clientCountry || "Bangladesh",
        program: clientProgram || "None",
        subject: clientSubject || "None",
        createdAt: new Date(), updatedAt: new Date()
      });
      finalClientId = newClient.insertedId;
    }

    let finalAdvance = Number(advancePaid) || 0;
    let finalStatus = status || 'pending';
    
    // Auto clear payment if task is instantly created as "done"
    if (finalStatus === 'done') {
        finalAdvance = (Number(totalValue) || 0) + (Number(bonus) || 0);
    }

    const task = await db.collection("assignment").insertOne({
      title, details: details || "", link: link || "", driveLink: driveLink || "",
      revisionCount: Number(revisionCount) || 0,
      workType, client: finalClientId, 
      deadline: deadline || null, totalValue: Number(totalValue) || 0, 
      advancePaid: finalAdvance, bonus: Number(bonus) || 0, assignedTo, status: finalStatus,
      writerPay: Number(writerPay) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    addLog("Task Created", `${title} deployed for ${clientName || 'Internal'}`);

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
    if (updates.bonus !== undefined) updates.bonus = Number(updates.bonus);
    if (updates.revisionCount !== undefined) updates.revisionCount = Number(updates.revisionCount) || 0;

    // If marked as done, AUTO CLEAR the payment safely from DB state
    if (updates.status === 'done') {
        const currentTask = await db.collection("assignment").findOne({ _id: new ObjectId(req.params.id) });
        if (currentTask) {
            const finalTotal = updates.totalValue !== undefined ? updates.totalValue : Number(currentTask.totalValue) || 0;
            const finalBonus = updates.bonus !== undefined ? updates.bonus : Number(currentTask.bonus) || 0;
            updates.advancePaid = finalTotal + finalBonus;

            // Auto-create invoice record
            const clientData = currentTask.client ? await db.collection("clients").findOne({ _id: new ObjectId(currentTask.client) }) : null;
            await db.collection("invoices").updateOne(
              { taskId: new ObjectId(req.params.id) },
              { 
                $set: {
                  taskId: new ObjectId(req.params.id),
                  clientName: clientData ? clientData.name : "Internal",
                  title: currentTask.title,
                  amount: finalTotal + finalBonus,
                  date: new Date(),
                  createdAt: new Date()
                },
                $setOnInsert: {
                  invoiceNumber: "INV-" + Date.now().toString().slice(-6)
                }
              },
              { upsert: true }
            );
        }
    }

    const result = await db.collection("assignment").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    addLog("Task Updated", `${updates.title || 'Task'} modified (Status: ${updates.status || 'N/A'})`);
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
    addLog("Task Deleted", `Task removed from system`);
    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👥 CLIENTS
app.get("/api/clients", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const clients = await db.collection("clients")
      .find({})
      .sort({ name: 1 })
      .toArray();

    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add-client", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const { name, phone, university, country, program, subject } = req.body;
    const result = await db.collection("clients").insertOne({
      name, phone, university, 
      country: country || "Bangladesh", 
      program: program || "None", 
      subject: subject || "None",
      createdAt: new Date(), updatedAt: new Date()
    });

    addLog("Client Added", `New client registered: ${name}`);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/update-client/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const { name, phone, university, country, program, subject } = req.body;
    const result = await db.collection("clients").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { 
        name, phone, university, 
        country: country || "Bangladesh", 
        program: program || "None", 
        subject: subject || "None",
        updatedAt: new Date() 
      } }
    );

    addLog("Client Updated", `Client profile updated: ${name}`);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 💰 ACCOUNTS (Expenses & Income)
app.get("/api/accounts", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const data = await db.collection("accounts")
      .find({})
      .sort({ date: -1 })
      .toArray();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add-account", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const { category, amount, description, type, taskId } = req.body;
    const transactionType = type || "expense"; // flexible schema for future income transactions

    const result = await db.collection("accounts").insertOne({
      category, 
      amount: Number(amount), 
      description, 
      type: transactionType, 
      taskId: taskId ? new ObjectId(taskId) : null,
      date: new Date(), 
      createdAt: new Date()
    });

    addLog("Expense Logged", `Amount: ৳${amount} for ${category}`);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/update-account/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    const { category, amount, description, type, taskId } = req.body;
    
    await db.collection("accounts").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { 
        category, 
        amount: Number(amount), 
        description, 
        type: type || "expense",
        taskId: taskId ? new ObjectId(taskId) : null
      } }
    );

    addLog("Expense Updated", `Transaction modified`);
    res.json({ message: "Updated" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/delete-account/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    await db.collection("accounts").deleteOne({ _id: new ObjectId(req.params.id) });

    addLog("Expense Deleted", `Transaction removed`);
    res.json({ message: "Deleted" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 🧾 INVOICES
app.get("/api/invoices", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");

    const data = await db.collection("invoices")
      .find({})
      .sort({ date: -1 })
      .toArray();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/delete-invoice/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    await db.collection("invoices").deleteOne({ _id: new ObjectId(req.params.id) });

    addLog("Invoice Deleted", `Invoice record removed`);
    res.json({ message: "Deleted" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 👥 WRITERS
app.get("/api/writers", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    const writers = await db.collection("writers").find({}).sort({ name: 1 }).toArray();
    res.json(writers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add-writer", checkPassword, async (req, res) => {
  try {
    const { name, imageLink, phone, email, dob, nid } = req.body;
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    // Auto-generate ID: WRT-XXXX-XXX
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(100 + Math.random() * 900);
    const writerId = `WRT-${part1}-${part2}`;

    const newWriter = {
      writerId,
      name,
      imageLink,
      phone,
      email,
      dob,
      nid,
      createdAt: new Date()
    };

    const result = await db.collection("writers").insertOne(newWriter);
    addLog("Writer Added", `${name} (${writerId}) added to team`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/update-writer/:id", checkPassword, async (req, res) => {
  try {
    const { _id, ...updates } = req.body;
    delete updates.password;
    const client = await clientPromise;
    const db = client.db("ak_process");

    const result = await db.collection("writers").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    addLog("Writer Updated", `Writer profile modified: ${updates.name || 'N/A'}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/delete-writer/:id", checkPassword, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    await db.collection("writers").deleteOne({ _id: new ObjectId(req.params.id) });
    addLog("Writer Deleted", `Writer removed from system`);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📜 GET LOGS
app.get("/api/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const client = await clientPromise;
    const db = client.db("ak_process");
    const logs = await db.collection("logs").find().sort({ timestamp: -1 }).limit(limit).toArray();
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 📊 WRITER STATS
app.get("/api/writer-stats", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ak_process");
    
    const stats = await db.collection("assignment").aggregate([
      {
        $group: {
          _id: "$assignedTo",
          totalEarnings: { $sum: { $cond: [{ $eq: ["$status", "done"] }, { $toDouble: { $ifNull: ["$writerPay", 0] } }, 0] } },
          pendingPayments: { $sum: { $cond: [{ $ne: ["$status", "done"] }, { $toDouble: { $ifNull: ["$writerPay", 0] } }, 0] } },
          activeWorkload: { $sum: { $cond: [{ $ne: ["$status", "done"] }, 1, 0] } },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } }
        }
      }
    ]).toArray();
    
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default app;
