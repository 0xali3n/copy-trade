import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { validateConfig } from "./config";

// Load environment variables
dotenv.config();

// Import routes
import tradingRoutes from "./routes/trading";
import dashboardRoutes from "./routes/dashboard";
import userRoutes from "./routes/user";
import authRoutes from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Validate configuration on startup
try {
  validateConfig();
  console.log("✅ Configuration validated successfully");
} catch (error) {
  console.error("❌ Configuration validation failed:", error);
  process.exit(1);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Kana Copy Trading Backend",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Kana Copy Trading Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      trading: "/api/trading",
      dashboard: "/api/dashboard",
      user: "/api/user",
    },
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Kana Copy Trading Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 API docs: http://localhost:${PORT}/`);
});

export default app;
