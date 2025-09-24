import express from "express";

const router = express.Router();

// Get user settings
router.get("/settings", (req, res) => {
  try {
    const settings = {
      targetWalletAddress: process.env.TARGET_WALLET_ADDRESS || "",
      copySizeMultiplier: 1.0,
      maxCopySize: 1000,
      minCopySize: 0.001,
      notifications: {
        email: true,
        webhook: false,
      },
      riskManagement: {
        maxLeverage: 10,
        stopLoss: 0.05, // 5%
        takeProfit: 0.1, // 10%
      },
    };

    res.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("Error getting user settings:", error);
    res.status(500).json({
      error: "Failed to get user settings",
      message: error.message,
    });
  }
});

// Update user settings
router.put("/settings", (req, res) => {
  try {
    const {
      targetWalletAddress,
      copySizeMultiplier,
      maxCopySize,
      minCopySize,
    } = req.body;

    // In a real application, you would save these to a database
    // For now, we'll just return the updated settings

    const updatedSettings = {
      targetWalletAddress:
        targetWalletAddress || process.env.TARGET_WALLET_ADDRESS || "",
      copySizeMultiplier: copySizeMultiplier || 1.0,
      maxCopySize: maxCopySize || 1000,
      minCopySize: minCopySize || 0.001,
      notifications: {
        email: true,
        webhook: false,
      },
      riskManagement: {
        maxLeverage: 10,
        stopLoss: 0.05,
        takeProfit: 0.1,
      },
    };

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error("Error updating user settings:", error);
    res.status(500).json({
      error: "Failed to update user settings",
      message: error.message,
    });
  }
});

// Get user preferences
router.get("/preferences", (req, res) => {
  try {
    const preferences = {
      theme: "dark",
      language: "en",
      timezone: "UTC",
      currency: "USD",
      notifications: {
        tradeExecuted: true,
        tradeFailed: true,
        dailyReport: true,
        weeklyReport: false,
      },
    };

    res.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error("Error getting user preferences:", error);
    res.status(500).json({
      error: "Failed to get user preferences",
      message: error.message,
    });
  }
});

// Update user preferences
router.put("/preferences", (req, res) => {
  try {
    const { theme, language, timezone, currency, notifications } = req.body;

    const updatedPreferences = {
      theme: theme || "dark",
      language: language || "en",
      timezone: timezone || "UTC",
      currency: currency || "USD",
      notifications: {
        tradeExecuted: notifications?.tradeExecuted ?? true,
        tradeFailed: notifications?.tradeFailed ?? true,
        dailyReport: notifications?.dailyReport ?? true,
        weeklyReport: notifications?.weeklyReport ?? false,
      },
    };

    res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: updatedPreferences,
    });
  } catch (error: any) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({
      error: "Failed to update user preferences",
      message: error.message,
    });
  }
});

export default router;
