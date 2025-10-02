import { supabase } from "../lib/supabase";

export interface SimpleBot {
  id: string;
  user_address: string;
  user_private_key: string;
  target_address: string;
  bot_name?: string;
  status: "active" | "paused" | "stopped";
  created_at: string;
  updated_at: string;
}

export interface CreateBotData {
  target_address: string;
  bot_name?: string;
  status?: "active" | "paused" | "stopped";
}

export interface UpdateBotData {
  bot_name?: string;
  status?: "active" | "paused" | "stopped";
}

class SimpleBotService {
  /**
   * Create a new bot
   */
  async createBot(botData: CreateBotData): Promise<SimpleBot> {
    try {
      console.log(
        "🔄 Creating bot with target address:",
        botData.target_address
      );

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Get user's wallet address and private key from the users table
      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("aptos_wallet_address, aptos_private_key")
        .eq("id", user.id)
        .single();

      if (
        userDataError ||
        !userData?.aptos_wallet_address ||
        !userData?.aptos_private_key
      ) {
        throw new Error(
          "User wallet address or private key not found. Please create a wallet first."
        );
      }

      // Create the bot
      const { data: bot, error } = await supabase
        .from("copy_trading_bots")
        .insert({
          user_address: userData.aptos_wallet_address,
          user_private_key: userData.aptos_private_key,
          target_address: botData.target_address,
          bot_name: botData.bot_name || null,
          status: botData.status || "active",
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
  async getUserBots(): Promise<SimpleBot[]> {
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

      // Get user's wallet address from the users table
      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("aptos_wallet_address")
        .eq("id", user.id)
        .single();

      if (userDataError || !userData?.aptos_wallet_address) {
        throw new Error(
          "User wallet address not found. Please create a wallet first."
        );
      }

      const { data: bots, error } = await supabase
        .from("copy_trading_bots")
        .select("*")
        .eq("user_address", userData.aptos_wallet_address)
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
  ): Promise<SimpleBot> {
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
}

export const simpleBotService = new SimpleBotService();
