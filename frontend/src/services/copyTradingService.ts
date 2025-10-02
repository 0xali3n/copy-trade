import { supabase } from "../lib/supabase";

export interface TargetWallet {
  id: string;
  target_address: string;
  profile_address?: string;
  created_at: string;
  updated_at: string;
  first_detected_by: string;
  total_copiers: number;
  is_active: boolean;
}

export interface CopyTradingBot {
  id: string;
  user_id: string;
  target_wallet_id: string;
  bot_name: string;
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
  // Joined data
  target_wallet?: TargetWallet;
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

class CopyTradingService {
  /**
   * Get or create a target wallet record
   */
  async getOrCreateTargetWallet(targetAddress: string): Promise<TargetWallet> {
    try {
      // First, try to get existing target wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from("target_wallets")
        .select("*")
        .eq("target_address", targetAddress)
        .single();

      if (existingWallet && !fetchError) {
        return existingWallet;
      }

      // If not found, create new target wallet
      const { data: newWallet, error: createError } = await supabase
        .from("target_wallets")
        .insert({
          target_address: targetAddress,
          first_detected_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(
          `Failed to create target wallet: ${createError.message}`
        );
      }

      return newWallet;
    } catch (error) {
      console.error("Error getting or creating target wallet:", error);
      throw error;
    }
  }

  /**
   * Create a new copy trading bot
   */
  async createBot(botData: CreateBotData): Promise<CopyTradingBot> {
    try {
      // Get or create target wallet
      const targetWallet = await this.getOrCreateTargetWallet(
        botData.target_address
      );

      // Create the bot
      const { data: bot, error } = await supabase
        .from("copy_trading_bots")
        .insert({
          target_wallet_id: targetWallet.id,
          bot_name: botData.bot_name,
          copy_size_multiplier: botData.copy_size_multiplier || 1.0,
          min_copy_size: botData.min_copy_size || 0.0001,
          max_copy_size: botData.max_copy_size || 0.001,
        })
        .select(
          `
          *,
          target_wallet:target_wallets(*)
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to create bot: ${error.message}`);
      }

      return bot;
    } catch (error) {
      console.error("Error creating bot:", error);
      throw error;
    }
  }

  /**
   * Get all bots for the current user
   */
  async getUserBots(): Promise<CopyTradingBot[]> {
    try {
      const { data: bots, error } = await supabase
        .from("copy_trading_bots")
        .select(
          `
          *,
          target_wallet:target_wallets(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bots: ${error.message}`);
      }

      return bots || [];
    } catch (error) {
      console.error("Error fetching user bots:", error);
      throw error;
    }
  }

  /**
   * Update a bot
   */
  async updateBot(
    botId: string,
    updateData: UpdateBotData
  ): Promise<CopyTradingBot> {
    try {
      const { data: bot, error } = await supabase
        .from("copy_trading_bots")
        .update(updateData)
        .eq("id", botId)
        .select(
          `
          *,
          target_wallet:target_wallets(*)
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to update bot: ${error.message}`);
      }

      return bot;
    } catch (error) {
      console.error("Error updating bot:", error);
      throw error;
    }
  }

  /**
   * Delete a bot
   */
  async deleteBot(botId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("copy_trading_bots")
        .delete()
        .eq("id", botId);

      if (error) {
        throw new Error(`Failed to delete bot: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deleting bot:", error);
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
      const { data: bots, error } = await supabase
        .from("copy_trading_bots")
        .select("status, total_trades, total_pnl, win_rate");

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
   * Get all target wallets (for discovery)
   */
  async getAllTargetWallets(): Promise<TargetWallet[]> {
    try {
      const { data: wallets, error } = await supabase
        .from("target_wallets")
        .select("*")
        .eq("is_active", true)
        .order("total_copiers", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch target wallets: ${error.message}`);
      }

      return wallets || [];
    } catch (error) {
      console.error("Error fetching target wallets:", error);
      throw error;
    }
  }

  /**
   * Update bot performance metrics (called by backend)
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
}

export const copyTradingService = new CopyTradingService();
