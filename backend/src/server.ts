import express from "express";
import cors from "cors";
import { config, getTimestamp } from "./config";
import { websocketService } from "./websocketService";
import { orderHistoryService } from "./orderHistoryService";
import { copyTradingService } from "./copyTradingService";

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
    websocket: websocketService.getStatus(),
    orderHistory: orderHistoryService.getStatus(),
    copyTrading: copyTradingService.getStatus(),
    config: {
      databaseDriven: true,
      aptosPrivateKeyConfigured: !!config.aptosPrivateKeyHex,
    },
  });
});

// Initialize services on server start
async function initializeServices() {
  try {
    if (config.kanaApiKey) {
      console.log(`${getTimestamp()} - 🔌 Initializing services...`);

      // Initialize basic WebSocket connection
      await websocketService.connect();
      console.log(`${getTimestamp()} - ✅ WebSocket connected to Kana Labs`);

      // Start order history monitoring from database
      console.log(
        `${getTimestamp()} - 🎯 Starting order history monitoring from database...`
      );
      await orderHistoryService.startMonitoringFromDatabase();
      console.log(
        `${getTimestamp()} - ✅ Order history monitoring started from database`
      );
    } else {
      console.log(
        `${getTimestamp()} - ⚠️  Services not initialized - missing KANA_API_KEY`
      );
    }
  } catch (error) {
    console.error(
      `${getTimestamp()} - ❌ Failed to initialize services:`,
      error
    );
  }
}

app.listen(config.port, async () => {
  console.log(`🚀 Kana Labs Backend running on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🔧 API status: http://localhost:${config.port}/api/status`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);

  // Initialize services
  await initializeServices();
});

export default app;
