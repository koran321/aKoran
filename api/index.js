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

// --- SCHEMAS ---
const securitySchema = new mongoose.Schema({ password: String });
const Security = mongoose.model("Security", securitySchema, "security");

const clientSchema = new mongoose.Schema({
  name: String,
  phone: String
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

// --- API ROUTES ---
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find().populate('client').sort({ createdAt: -1 });
  res.json(tasks);
});

app.post("/add-task", checkPassword, async (req, res) => {
  const { title, details, workType, clientId, clientName, clientPhone, deadline, totalValue, advancePaid, assignedTo } = req.body;
  let finalClientId = clientId;
  if (clientId === 'new' && (clientName || clientPhone)) {
    const newClient = await Client.create({ name: clientName || "Unnamed Client", phone: clientPhone || "" });
    finalClientId = newClient._id;
  }
  const task = await Task.create({ title, details, workType, client: finalClientId, deadline, totalValue, advancePaid, assignedTo });
  res.json(task);
});

app.put("/update-task/:id", checkPassword, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

app.delete("/delete-task/:id", checkPassword, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.get("/clients", async (req, res) => {
  const clients = await Client.find().sort({ name: 1 });
  res.json(clients);
});

app.post("/add-client", checkPassword, async (req, res) => {
  const client = await Client.create(req.body);
  res.json(client);
});

app.put("/update-client/:id", checkPassword, async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(client);
});

app.get("/accounts", async (req, res) => {
  const expenses = await Account.find().sort({ date: -1 });
  res.json(expenses);
});

app.post("/add-account", checkPassword, async (req, res) => {
  const expense = await Account.create(req.body);
  res.json(expense);
});

app.delete("/delete-account/:id", checkPassword, async (req, res) => {
  await Account.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Vercel Stats Helper
app.get("/dashboard-stats", async (req, res) => {
  const tasks = await Task.find();
  const txs = await Account.find();
  let totalTaskValue = 0, totalAdvance = 0, totalExp = 0;
  tasks.forEach(t => { totalTaskValue += (t.totalValue || 0); totalAdvance += (t.advancePaid || 0); });
  txs.forEach(tx => totalExp += (tx.amount || 0));
  res.json({ totalIn: totalAdvance, totalExpenses: totalExp, netBalance: totalAdvance - totalExp, pendingTasks: tasks.filter(t => t.status !== 'done').length });
});

export default app;
