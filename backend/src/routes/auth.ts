import express, { Request, Response } from "express";
import { UserService, User } from "../lib/supabase";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { getTimestamp } from "../config";

const router = express.Router();

// Login with wallet address
router.post("/login", async (req, res) => {
  try {
    const { walletAddress, walletName, signature } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: "Wallet address is required",
        message: "Please provide a valid wallet address",
      });
    }

    console.log(
      `${getTimestamp()} - Login attempt for wallet: ${walletAddress}`
    );

    // Create or get user
    const user = await UserService.createOrGetUser(walletAddress, walletName);

    // Create session
    const session = await UserService.createSession(user.id, walletAddress);

    console.log(`${getTimestamp()} - User logged in successfully: ${user.id}`);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        wallet_name: user.wallet_name,
        created_at: user.created_at,
        trading_settings: user.trading_settings,
      },
      session: {
        token: session.session_token,
        expires_at: session.expires_at,
      },
    });
  } catch (error: any) {
    console.error(`${getTimestamp()} - Login error:`, error);
    res.status(500).json({
      error: "Login failed",
      message: error.message || "Internal server error",
    });
  }
});

// Logout
router.post("/logout", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.session_token;

    if (sessionToken) {
      await UserService.invalidateSession(sessionToken);
    }

    console.log(`${getTimestamp()} - User logged out: ${user.id}`);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error: any) {
    console.error(`${getTimestamp()} - Logout error:`, error);
    res.status(500).json({
      error: "Logout failed",
      message: error.message || "Internal server error",
    });
  }
});

// Get current user profile
router.get("/me", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    res.json({
      success: true,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        wallet_name: user.wallet_name,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        profile_data: user.profile_data,
        trading_settings: user.trading_settings,
      },
    });
  } catch (error: any) {
    console.error(`${getTimestamp()} - Get profile error:`, error);
    res.status(500).json({
      error: "Failed to get user profile",
      message: error.message || "Internal server error",
    });
  }
});

// Update user profile
router.put("/profile", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { profile_data } = req.body;
    const userId = user.id;

    // Update user profile data
    const updatedUser = await UserService.updateUserProfile(
      userId,
      profile_data
    );

    console.log(`${getTimestamp()} - Profile updated for user: ${userId}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        wallet_address: updatedUser.wallet_address,
        wallet_name: updatedUser.wallet_name,
        profile_data: updatedUser.profile_data,
        trading_settings: updatedUser.trading_settings,
      },
    });
  } catch (error: any) {
    console.error(`${getTimestamp()} - Update profile error:`, error);
    res.status(500).json({
      error: "Failed to update profile",
      message: error.message || "Internal server error",
    });
  }
});

// Update trading settings
router.put("/settings", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const {
      copy_size_multiplier,
      max_copy_size,
      min_copy_size,
      target_wallet_address,
    } = req.body;
    const userId = user.id;

    const updatedSettings = {
      copy_size_multiplier:
        copy_size_multiplier ?? user.trading_settings?.copy_size_multiplier,
      max_copy_size: max_copy_size ?? user.trading_settings?.max_copy_size,
      min_copy_size: min_copy_size ?? user.trading_settings?.min_copy_size,
      target_wallet_address:
        target_wallet_address ?? user.trading_settings?.target_wallet_address,
    };

    const updatedUser = await UserService.updateUserSettings(
      userId,
      updatedSettings
    );

    console.log(`${getTimestamp()} - Settings updated for user: ${userId}`);

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedUser.trading_settings,
    });
  } catch (error: any) {
    console.error(`${getTimestamp()} - Update settings error:`, error);
    res.status(500).json({
      error: "Failed to update settings",
      message: error.message || "Internal server error",
    });
  }
});

// Verify session
router.get("/verify", authenticateUser, async (req: Request, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    res.json({
      success: true,
      message: "Session is valid",
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        wallet_name: user.wallet_name,
      },
    });
  } catch (error: any) {
    console.error(`${getTimestamp()} - Verify session error:`, error);
    res.status(500).json({
      error: "Failed to verify session",
      message: error.message || "Internal server error",
    });
  }
});

export default router;
