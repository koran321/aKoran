import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import writerRoutes from "./routes/writerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import clientPortalRoutes from "./routes/clientPortalRoutes.js";
import { UploadController } from "./controllers/uploadController.js";
import { StatsController } from "./controllers/statsController.js";
import { checkSession } from "./middleware/auth.js";
import { LoggerService } from "./services/loggerService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Serve static files
app.use(express.static(path.join(__dirname, "../")));

// API Routes
app.use("/api", authRoutes);
app.use("/api", taskRoutes);
app.use("/api", clientRoutes);
app.use("/api", expenseRoutes);
app.use("/api", writerRoutes);
app.use("/api", invoiceRoutes);
app.use("/api/client-portal", clientPortalRoutes);
app.post("/api/upload-image", UploadController.uploadImage);

// Other Routes (Logs, Stats)
app.get("/api/stats", checkSession, StatsController.getDashboardStats);
app.get("/api/logs", checkSession, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const logs = await LoggerService.getLogs(limit);
  res.json(logs);
});

export default app;
