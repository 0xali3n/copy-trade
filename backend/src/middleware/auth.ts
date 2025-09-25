import { Request, Response, NextFunction } from "express";
import { UserService, User } from "../lib/supabase";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

// Middleware to authenticate user by session token
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.session_token;

    if (!sessionToken) {
      res.status(401).json({
        error: "Authentication required",
        message: "No session token provided",
      });
      return;
    }

    const user = await UserService.validateSession(sessionToken);

    if (!user) {
      res.status(401).json({
        error: "Invalid session",
        message: "Session token is invalid or expired",
      });
      return;
    }

    // Type assertion to ensure user is set
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Authentication failed",
      message: "Internal server error during authentication",
    });
  }
};

// Middleware to authenticate user by wallet address (for wallet-based auth)
export const authenticateWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    const signature = req.headers["x-wallet-signature"] as string;

    if (!walletAddress) {
      res.status(401).json({
        error: "Wallet authentication required",
        message: "Wallet address not provided",
      });
      return;
    }

    // For now, we'll trust the wallet address from the header
    // In production, you should verify the signature
    const user = await UserService.getUserByWallet(walletAddress);

    if (!user) {
      res.status(404).json({
        error: "User not found",
        message: "No user found for this wallet address",
      });
      return;
    }

    // Type assertion to ensure user is set
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    console.error("Wallet authentication error:", error);
    res.status(500).json({
      error: "Wallet authentication failed",
      message: "Internal server error during wallet authentication",
    });
  }
};

// Optional middleware - doesn't fail if no auth
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.session_token;

    if (sessionToken) {
      const user = await UserService.validateSession(sessionToken);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    // Continue without authentication
    next();
  }
};
