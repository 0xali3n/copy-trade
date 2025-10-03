import { supabase } from "../lib/supabase";

export interface SimpleCopyTradingBot {
  id: string;
  user_id: string;
  bot_name: string;
  target_address: string;
  status: "active" | "paused" | "stopped";
  copy_size_multiplier: number;
  min_copy_size: number;
  max_copy_size: number;
  copy_trading_enabled: boolean;
  total_trades: number;
  successful_trades: number;
  failed_trades: number;
  total_pnl: number;
  win_rate: number;
  created_at: string;
  updated_at: string;
  last_trade_at?: string;
  started_at: string;
}

export interface CreateBotData {
  bot_name: string;
  target_address: string;
  copy_size_multiplier?: number;
  min_copy_size?: number;
  max_copy_size?: number;
}

export interface UpdateBotData {
  bot_name?: string;
  status?: "active" | "paused" | "stopped";
  copy_size_multiplier?: number;
  min_copy_size?: number;
  max_copy_size?: number;
  copy_trading_enabled?: boolean;
}

class SimpleCopyTradingService {
  /**
   * Create a new copy trading bot
   */
  async createBot(botData: CreateBotData): Promise<SimpleCopyTradingBot> {
    try {
      console.log("🔄 Creating bot with data:", botData);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Create the bot
      const { data: bot, error } = await supabase
        .from("copy_trading_bots")
        .insert({
          user_id: user.id,
          bot_name: botData.bot_name,
          target_address: botData.target_address,
          copy_size_multiplier: botData.copy_size_multiplier || 1.0,
          min_copy_size: botData.min_copy_size || 0.0001,
          max_copy_size: botData.max_copy_size || 0.001,
          status: "active",
          copy_trading_enabled: true,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Error creating bot:", error);
        throw new Error(`Failed to create bot: ${error.message}`);
      }

      console.log("✅ Bot created successfully:", bot);
      return bot;
    } catch (error) {
      console.error("❌ Error creating bot:", error);
      throw error;
    }
  }

  /**
   * Get all bots for the current user
   */
  async getUserBots(): Promise<SimpleCopyTradingBot[]> {
    try {
      console.log("🔄 Fetching user bots...");

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { data: bots, error } = await supabase
        .from("copy_trading_bots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching bots:", error);
        throw new Error(`Failed to fetch bots: ${error.message}`);
      }

      console.log("✅ Bots fetched successfully:", bots?.length || 0, "bots");
      return bots || [];
    } catch (error) {
      console.error("❌ Error fetching user bots:", error);
      throw error;
    }
  }

  /**
   * Update a bot
   */
  async updateBot(
    botId: string,
    updateData: UpdateBotData
  ): Promise<SimpleCopyTradingBot> {
    try {
      console.log("🔄 Updating bot:", botId, "with data:", updateData);

      const { data: bot, error } = await supabase
        .from("copy_trading_bots")
        .update(updateData)
        .eq("id", botId)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating bot:", error);
        throw new Error(`Failed to update bot: ${error.message}`);
      }

      console.log("✅ Bot updated successfully:", bot);
      return bot;
    } catch (error) {
      console.error("❌ Error updating bot:", error);
      throw error;
    }
  }

  /**
   * Delete a bot
   */
  async deleteBot(botId: string): Promise<void> {
    try {
      console.log("🔄 Deleting bot:", botId);

      const { error } = await supabase
        .from("copy_trading_bots")
        .delete()
        .eq("id", botId);

      if (error) {
        console.error("❌ Error deleting bot:", error);
        throw new Error(`Failed to delete bot: ${error.message}`);
      }

      console.log("✅ Bot deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting bot:", error);
      throw error;
    }
  }

  /**
   * Get bot statistics
   */
  async getBotStats(): Promise<{
    totalBots: number;
    activeBots: number;
    pausedBots: number;
    stoppedBots: number;
    totalTrades: number;
    totalPnl: number;
    avgWinRate: number;
  }> {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { data: bots, error } = await supabase
        .from("copy_trading_bots")
        .select("status, total_trades, total_pnl, win_rate")
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Failed to fetch bot stats: ${error.message}`);
      }

      const stats = {
        totalBots: bots.length,
        activeBots: bots.filter((bot) => bot.status === "active").length,
        pausedBots: bots.filter((bot) => bot.status === "paused").length,
        stoppedBots: bots.filter((bot) => bot.status === "stopped").length,
        totalTrades: bots.reduce(
          (sum, bot) => sum + (bot.total_trades || 0),
          0
        ),
        totalPnl: bots.reduce((sum, bot) => sum + (bot.total_pnl || 0), 0),
        avgWinRate:
          bots.length > 0
            ? bots.reduce((sum, bot) => sum + (bot.win_rate || 0), 0) /
              bots.length
            : 0,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching bot stats:", error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("🔄 Testing database connection...");

      const { error } = await supabase
        .from("copy_trading_bots")
        .select("count")
        .limit(1);

      if (error) {
        console.error("❌ Database connection failed:", error);
        return false;
      }

      console.log("✅ Database connection successful");
      return true;
    } catch (error) {
      console.error("❌ Database connection test failed:", error);
      return false;
    }
  }
}

export const simpleCopyTradingService = new SimpleCopyTradingService();
