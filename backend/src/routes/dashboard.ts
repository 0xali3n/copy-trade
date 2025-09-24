import express from "express";
import { getProfile } from "../getProfile";
import { getDepositAndBalance } from "../depositAndBalance";

const router = express.Router();

// Get user profile information
router.get("/profile", async (req, res) => {
  try {
    const profile = await getProfile();
    res.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("Error getting profile:", error);
    res.status(500).json({
      error: "Failed to get profile",
      message: error.message,
    });
  }
});

// Get user balance and deposit information
router.get("/balance", async (req, res) => {
  try {
    const balance = await getDepositAndBalance();
    res.json({
      success: true,
      balance,
    });
  } catch (error: any) {
    console.error("Error getting balance:", error);
    res.status(500).json({
      error: "Failed to get balance",
      message: error.message,
    });
  }
});

// Get market information
router.get("/markets", (req, res) => {
  try {
    const markets = [
      { id: 15, name: "BTC-USD", symbol: "BTC", baseCurrency: "USD" },
      { id: 16, name: "ETH-USD", symbol: "ETH", baseCurrency: "USD" },
      { id: 17, name: "SOL-USD", symbol: "SOL", baseCurrency: "USD" },
      { id: 18, name: "APT-USD", symbol: "APT", baseCurrency: "USD" },
      { id: 19, name: "SUI-USD", symbol: "SUI", baseCurrency: "USD" },
    ];

    res.json({
      success: true,
      markets,
    });
  } catch (error: any) {
    console.error("Error getting markets:", error);
    res.status(500).json({
      error: "Failed to get markets",
      message: error.message,
    });
  }
});

// Get trading statistics
router.get("/stats", (req, res) => {
  try {
    // This would typically come from a database
    const stats = {
      totalTrades: 0,
      successfulTrades: 0,
      totalProfit: 0,
      winRate: 0,
      averageTradeSize: 0,
      lastTradeTime: null,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      error: "Failed to get stats",
      message: error.message,
    });
  }
});

export default router;
