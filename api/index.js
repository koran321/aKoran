import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const uri = "mongodb+srv://bsnsone:shihabsolidgets@akcluster0.zax3xwc.mongodb.net/ak_process?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// --- 🚀 SERVER-SIDE CACHE ---
// Vercel serverless functions keep variables in memory while "warm".
let appCache = {};

// Clears the cache whenever data is modified
const clearCache = () => {
  appCache = {};
};

// --- SCHEMAS ---
const securitySchema = new mongoose.Schema({ password: String });
const Security = mongoose.model("Security", securitySchema, "security");

const clientSchema = new mongoose.Schema({
  name: String,
  phone: String,
  university: { type: String, default: "" } // ✅ NEW FIELD: University
}, { timestamps: true });
const Client = mongoose.model("Client", clientSchema, "clients");

const taskSchema = new mongoose.Schema({
  title: String,
  details: { type: String, default: "" },
  workType: { type: String, default: "Assignment" }, 
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  deadline: { type: Date, default: null },
  totalValue: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  assignedTo: { type: String, default: "Imranul Islam Shihab" },
  status: { type: String, default: "pending" }
}, { timestamps: true });
const Task = mongoose.model("Task", taskSchema, "assignment");

const accountSchema = new mongoose.Schema({
  category: String, 
  amount: Number,
  description: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });
const Account = mongoose.model("Account", accountSchema, "accounts");

// --- MIDDLEWARE ---
const checkPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const sec = await Security.findOne();
    if (!sec || sec.password !== password) {
      return res.status(401).json({ message: "Invalid Auth Token / Password" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Internal Auth Error" });
  }
};

// --- API ROUTES (Updated to /api/...) ---

// 📊 STATS
app.get("/api/dashboard-stats", async (req, res) => {
  if (appCache.stats) return res.json(appCache.stats); // ⚡ Cache Hit

  try {
    const tasks = await Task.find();
    const txs = await Account.find();
    let totalTaskValue = 0, totalAdvance = 0, totalExp = 0, expectedEarnings = 0;

    tasks.forEach(t => { 
      totalTaskValue += (t.totalValue || 0); 
      totalAdvance += (t.advancePaid || 0); 
      if (t.status !== 'done') expectedEarnings += ((t.totalValue || 0) - (t.advancePaid || 0));
    });
    txs.forEach(tx => totalExp += (tx.amount || 0));
    
    const stats = { 
      totalIn: totalAdvance, 
      expectedEarnings,
      totalExpenses: totalExp, 
      netBalance: totalAdvance - totalExp, 
      pendingTasks: tasks.filter(t => t.status !== 'done').length 
    };

    appCache.stats = stats; // ⚡ Cache Save
    res.json(stats);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 📌 TASKS (With Pagination)
app.get("/api/tasks", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30; // 30 tasks per page
    const cacheKey = `tasks_${page}_${limit}`;

    if (appCache[cacheKey]) return res.json(appCache[cacheKey]); // ⚡ Cache Hit

    const skip = (page - 1) * limit;
    const total = await Task.countDocuments();
    const tasks = await Task.find().populate('client').sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    const result = { data: tasks, total, page, totalPages: Math.ceil(total / limit) };
    appCache[cacheKey] = result; // ⚡ Cache Save
    
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/add-task", checkPassword, async (req, res) => {
  try {
    const { title, details, workType, clientId, clientName, clientPhone, clientUniversity, deadline, totalValue, advancePaid, assignedTo } = req.body;
    let finalClientId = clientId;

    if (clientId === 'new' && (clientName || clientPhone)) {
      const newClient = await Client.create({ name: clientName || "Unnamed Client", phone: clientPhone || "", university: clientUniversity || "" });
      finalClientId = newClient._id;
    } else if (clientId === 'new') { finalClientId = null; }

    const task = await Task.create({
      title, details: details || "", workType, client: finalClientId, 
      deadline: deadline || null, totalValue: totalValue || 0, 
      advancePaid: advancePaid || 0, assignedTo
    });

    clearCache(); // 🧹 Clear Cache on update
    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/update-task/:id", checkPassword, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    if (updates.deadline === "") updates.deadline = null;

    let finalClientId = updates.clientId;
    if (finalClientId === 'new') {
      if ((updates.clientName && updates.clientName.trim() !== "") || (updates.clientPhone && updates.clientPhone.trim() !== "")) {
        const newClient = await Client.create({ name: updates.clientName || "Unnamed Client", phone: updates.clientPhone || "", university: updates.clientUniversity || "" });
        finalClientId = newClient._id;
      } else { finalClientId = null; }
    }

    if (finalClientId !== undefined) updates.client = finalClientId || null;
    delete updates.clientId; delete updates.clientName; delete updates.clientPhone; delete updates.clientUniversity;

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
    clearCache(); // 🧹 Clear Cache
    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/delete-task/:id", checkPassword, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    clearCache(); // 🧹 Clear Cache
    res.json({ message: "Deleted" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 👥 CLIENTS
app.get("/api/clients", async (req, res) => {
  if (appCache.clients) return res.json(appCache.clients);
  try {
    const clients = await Client.find().sort({ name: 1 });
    appCache.clients = clients;
    res.json(clients);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/add-client", checkPassword, async (req, res) => {
  try {
    const client = await Client.create(req.body);
    clearCache(); // 🧹 Clear Cache
    res.json(client);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/update-client/:id", checkPassword, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    clearCache(); // 🧹 Clear Cache
    res.json(client);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 💰 ACCOUNTS (Expenses)
app.get("/api/accounts", async (req, res) => {
  if (appCache.accounts) return res.json(appCache.accounts);
  try {
    const expenses = await Account.find().sort({ date: -1 });
    appCache.accounts = expenses;
    res.json(expenses);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/add-account", checkPassword, async (req, res) => {
  try {
    const expense = await Account.create(req.body);
    clearCache(); // 🧹 Clear Cache
    res.json(expense);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/delete-account/:id", checkPassword, async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    clearCache(); // 🧹 Clear Cache
    res.json({ message: "Deleted" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default app;
