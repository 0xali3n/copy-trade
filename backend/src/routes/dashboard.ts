import express, { Request, Response } from "express";
import { getProfile } from "../getProfile";
import { getDepositAndBalance } from "../depositAndBalance";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Get user profile information
router.get("/profile", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const profile = await getProfile();
    res.json({
      success: true,
      profile,
      user: user,
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
router.get("/balance", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const balance = await getDepositAndBalance();
    res.json({
      success: true,
      balance,
      user: user,
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
router.get("/stats", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    // This would typically come from a database
    const stats = {
      totalTrades: 0,
      successfulTrades: 0,
      totalProfit: 0,
      winRate: 0,
      averageTradeSize: 0,
      lastTradeTime: null,
      userId: user.id,
    };

    res.json({
      success: true,
      stats,
      user: user,
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
