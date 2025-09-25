import express, { Request, Response } from "express";
import { CopyTradingBot } from "../services/copyTradingService";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Global copy trading bot instance
let copyTradingBot: CopyTradingBot | null = null;

// Start copy trading
router.post("/start", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const {
      targetWalletAddress,
      copySizeMultiplier,
      maxCopySize,
      minCopySize,
    } = req.body;

    if (copyTradingBot && copyTradingBot.isRunning()) {
      return res.status(400).json({
        error: "Copy trading is already running",
        message: "Stop the current session before starting a new one",
      });
    }

    // Create new copy trading bot instance
    copyTradingBot = new CopyTradingBot({
      targetWalletAddress:
        targetWalletAddress || process.env.TARGET_WALLET_ADDRESS,
      copySizeMultiplier: copySizeMultiplier || 1.0,
      maxCopySize: maxCopySize || 1000,
      minCopySize: minCopySize || 0.001,
      copyTradingEnabled: true,
    });

    await copyTradingBot.start();

    res.json({
      success: true,
      message: "Copy trading started successfully",
      targetWalletAddress: copyTradingBot.getTargetWalletAddress(),
      settings: {
        copySizeMultiplier: copyTradingBot.getCopySizeMultiplier(),
        maxCopySize: copyTradingBot.getMaxCopySize(),
        minCopySize: copyTradingBot.getMinCopySize(),
      },
    });
  } catch (error: any) {
    console.error("Error starting copy trading:", error);
    res.status(500).json({
      error: "Failed to start copy trading",
      message: error.message,
    });
  }
});

// Stop copy trading
router.post("/stop", authenticateUser, async (req: Request, res) => {
  try {
    if (!copyTradingBot || !copyTradingBot.isRunning()) {
      return res.status(400).json({
        error: "Copy trading is not running",
        message: "No active copy trading session found",
      });
    }

    await copyTradingBot.stop();
    copyTradingBot = null;

    res.json({
      success: true,
      message: "Copy trading stopped successfully",
    });
  } catch (error: any) {
    console.error("Error stopping copy trading:", error);
    res.status(500).json({
      error: "Failed to stop copy trading",
      message: error.message,
    });
  }
});

// Get copy trading status
router.get("/status", authenticateUser, (req: Request, res) => {
  try {
    const isRunning = copyTradingBot ? copyTradingBot.isRunning() : false;

    res.json({
      isRunning,
      targetWalletAddress: copyTradingBot?.getTargetWalletAddress() || null,
      settings: copyTradingBot
        ? {
            copySizeMultiplier: copyTradingBot.getCopySizeMultiplier(),
            maxCopySize: copyTradingBot.getMaxCopySize(),
            minCopySize: copyTradingBot.getMinCopySize(),
          }
        : null,
      uptime: copyTradingBot?.getUptime() || 0,
    });
  } catch (error: any) {
    console.error("Error getting copy trading status:", error);
    res.status(500).json({
      error: "Failed to get copy trading status",
      message: error.message,
    });
  }
});

// Update copy trading settings
router.put("/settings", authenticateUser, async (req: Request, res) => {
  try {
    const { copySizeMultiplier, maxCopySize, minCopySize } = req.body;

    if (!copyTradingBot) {
      return res.status(400).json({
        error: "Copy trading not initialized",
        message: "Start copy trading first before updating settings",
      });
    }

    if (copySizeMultiplier !== undefined) {
      copyTradingBot.setCopySizeMultiplier(copySizeMultiplier);
    }
    if (maxCopySize !== undefined) {
      copyTradingBot.setMaxCopySize(maxCopySize);
    }
    if (minCopySize !== undefined) {
      copyTradingBot.setMinCopySize(minCopySize);
    }

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        copySizeMultiplier: copyTradingBot.getCopySizeMultiplier(),
        maxCopySize: copyTradingBot.getMaxCopySize(),
        minCopySize: copyTradingBot.getMinCopySize(),
      },
    });
  } catch (error: any) {
    console.error("Error updating copy trading settings:", error);
    res.status(500).json({
      error: "Failed to update settings",
      message: error.message,
    });
  }
});

// Get recent trading activity
router.get("/activity", authenticateUser, (req: Request, res) => {
  try {
    if (!copyTradingBot) {
      return res.json({
        activity: [],
        message: "Copy trading not initialized",
      });
    }

    const activity = copyTradingBot.getRecentActivity();
    res.json({
      activity,
      totalOrders: activity.length,
    });
  } catch (error: any) {
    console.error("Error getting trading activity:", error);
    res.status(500).json({
      error: "Failed to get trading activity",
      message: error.message,
    });
  }
});

export default router;
