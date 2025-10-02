import express from "express";
import cors from "cors";
import { config, getTimestamp } from "./config";

const app = express();

// Middleware
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Kana Labs Backend is running",
    timestamp: getTimestamp(),
    config: {
      port: config.port,
      frontendUrl: config.frontendUrl,
      supabaseConfigured: !!config.supabaseUrl,
      kanaConfigured: !!config.kanaApiKey,
      gasWalletConfigured: !!config.gasWalletPrivateKey,
    },
  });
});

// API Routes
app.get("/api/status", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend API is healthy",
    timestamp: getTimestamp(),
    services: {
      supabase: !!config.supabaseUrl,
      kana: !!config.kanaApiKey,
      aptos: !!config.aptosNode,
    },
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Kana Labs Backend running on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🔧 API status: http://localhost:${config.port}/api/status`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
});

export default app;
