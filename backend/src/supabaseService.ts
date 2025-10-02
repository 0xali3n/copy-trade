import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

export interface CopyTradingBot {
  id: string;
  target_address: string;
  user_address: string;
  user_private_key: string;
  bot_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  aptos_wallet_address?: string;
  aptos_private_key?: string;
  created_at: string;
}

class SupabaseService {
  /**
   * Get all active copy trading bots
   */
  async getActiveCopyTradingBots(): Promise<CopyTradingBot[]> {
    try {
      const { data, error } = await supabase
        .from("copy_trading_bots")
        .select("*")
        .eq("status", "active");

      if (error) {
        throw new Error(
          `Failed to fetch active copy trading bots: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching active copy trading bots:", error);
      throw error;
    }
  }

  /**
   * Get all unique target addresses from active bots
   */
  async getActiveTargetAddresses(): Promise<string[]> {
    try {
      const bots = await this.getActiveCopyTradingBots();
      const targetAddresses = new Set<string>();

      bots.forEach((bot) => {
        if (bot.target_address) {
          targetAddresses.add(bot.target_address);
        }
      });

      return Array.from(targetAddresses);
    } catch (error) {
      console.error("Error getting active target addresses:", error);
      throw error;
    }
  }

  /**
   * Get copy trading bots for a specific target address
   */
  async getBotsForTargetAddress(
    targetAddress: string
  ): Promise<CopyTradingBot[]> {
    try {
      const { data, error } = await supabase
        .from("copy_trading_bots")
        .select("*")
        .eq("target_address", targetAddress)
        .eq("status", "active");

      if (error) {
        throw new Error(
          `Failed to fetch bots for target address: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching bots for target address:", error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, email, full_name, aptos_wallet_address, aptos_private_key, created_at"
        )
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // User not found
        }
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  /**
   * Update bot performance metrics
   */
  async updateBotPerformance(
    botId: string,
    metrics: {
      total_trades?: number;
      successful_trades?: number;
      failed_trades?: number;
      total_pnl?: number;
      win_rate?: number;
      last_trade_at?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("copy_trading_bots")
        .update(metrics)
        .eq("id", botId);

      if (error) {
        throw new Error(`Failed to update bot performance: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating bot performance:", error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("copy_trading_bots")
        .select("count")
        .limit(1);

      if (error) {
        console.error("Database connection test failed:", error);
        return false;
      }

      console.log("✅ Database connection successful");
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();
