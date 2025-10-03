import { supabase } from "../lib/supabase";

export interface CopyTradingTrade {
  id: string;
  user_wallet_address: string;
  bot_id: string;
  symbol: string;
  market_id: string;
  action: "BUY" | "SELL" | "EXIT_LONG" | "EXIT_SHORT";
  order_type: "MARKET" | "LIMIT" | "STOP";
  leverage: number;
  price: number;
  quantity: number;
  transaction_hash?: string;
  order_id?: string;
  target_address?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  created_at: string;
  updated_at: string;
  pnl?: number;
  fees?: number;
}

export interface TradeStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnl: number;
  winRate: number;
}

export class TradesService {
  /**
   * Get trades for a specific user
   */
  static async getUserTrades(
    userWalletAddress: string,
    limit: number = 10,
    offset: number = 0,
    statusFilter?: "SUCCESS" | "FAILED" | "PENDING"
  ): Promise<CopyTradingTrade[]> {
    try {
      console.log(`🔍 Fetching trades for user wallet: ${userWalletAddress}`);

      let query = supabase
        .from("copy_trading_trades")
        .select("*")
        .eq("user_wallet_address", userWalletAddress);

      // Filter by status if specified
      if (statusFilter) {
        query = query.eq("status", statusFilter);
        console.log(`🔍 Filtering by status: ${statusFilter}`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("❌ Error fetching user trades:", error);
        throw error;
      }

      console.log(
        `✅ Found ${data?.length || 0} trades for user ${userWalletAddress}${
          statusFilter ? ` (${statusFilter} only)` : ""
        }`
      );
      return data || [];
    } catch (error) {
      console.error("❌ Error in getUserTrades:", error);
      return [];
    }
  }

  /**
   * Get trades for a specific bot
   */
  static async getBotTrades(
    botId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<CopyTradingTrade[]> {
    try {
      const { data, error } = await supabase
        .from("copy_trading_trades")
        .select("*")
        .eq("bot_id", botId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching bot trades:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getBotTrades:", error);
      return [];
    }
  }

  /**
   * Get recent trades across all users
   */
  static async getRecentTrades(
    limit: number = 20
  ): Promise<CopyTradingTrade[]> {
    try {
      const { data, error } = await supabase
        .from("copy_trading_trades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching recent trades:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getRecentTrades:", error);
      return [];
    }
  }

  /**
   * Get trade statistics for a user
   */
  static async getUserTradeStats(
    userWalletAddress: string
  ): Promise<TradeStats> {
    try {
      const { data, error } = await supabase
        .from("copy_trading_trades")
        .select("status, pnl")
        .eq("user_wallet_address", userWalletAddress);

      if (error) {
        console.error("Error fetching trade stats:", error);
        throw error;
      }

      const trades = data || [];
      const totalTrades = trades.length;
      const successfulTrades = trades.filter(
        (t) => t.status === "SUCCESS"
      ).length;
      const failedTrades = trades.filter((t) => t.status === "FAILED").length;
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winRate =
        totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

      return {
        totalTrades,
        successfulTrades,
        failedTrades,
        totalPnl,
        winRate,
      };
    } catch (error) {
      console.error("Error in getUserTradeStats:", error);
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalPnl: 0,
        winRate: 0,
      };
    }
  }

  /**
   * Get trade statistics for a bot
   */
  static async getBotTradeStats(botId: string): Promise<TradeStats> {
    try {
      const { data, error } = await supabase
        .from("copy_trading_trades")
        .select("status, pnl")
        .eq("bot_id", botId);

      if (error) {
        console.error("Error fetching bot trade stats:", error);
        throw error;
      }

      const trades = data || [];
      const totalTrades = trades.length;
      const successfulTrades = trades.filter(
        (t) => t.status === "SUCCESS"
      ).length;
      const failedTrades = trades.filter((t) => t.status === "FAILED").length;
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winRate =
        totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

      return {
        totalTrades,
        successfulTrades,
        failedTrades,
        totalPnl,
        winRate,
      };
    } catch (error) {
      console.error("Error in getBotTradeStats:", error);
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalPnl: 0,
        winRate: 0,
      };
    }
  }

  /**
   * Subscribe to real-time trade updates
   */
  static subscribeToTrades(
    userWalletAddress: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel("trades_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "copy_trading_trades",
          filter: `user_wallet_address=eq.${userWalletAddress}`,
        },
        callback
      )
      .subscribe();
  }
}
