import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

// Validate Supabase configuration
if (!config.supabaseUrl || !config.supabaseServiceKey) {
  console.error("❌ Supabase configuration is missing!");
  console.error(
    "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file"
  );
  process.exit(1);
}

// Initialize Supabase client
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey
);

// Database types
export interface User {
  id: string;
  wallet_address: string;
  wallet_name?: string;
  created_at: string;
  updated_at: string;
  last_login: string;
  profile_data?: {
    display_name?: string;
    avatar_url?: string;
    preferences?: any;
  };
  trading_settings?: {
    copy_size_multiplier: number;
    max_copy_size: number;
    min_copy_size: number;
    target_wallet_address?: string;
  };
}

export interface UserSession {
  id: string;
  user_id: string;
  wallet_address: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

// Database operations
export class UserService {
  // Create or get user by wallet address
  static async createOrGetUser(
    walletAddress: string,
    walletName?: string
  ): Promise<User> {
    try {
      // First, try to get existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (existingUser && !fetchError) {
        // Update last login
        await supabase
          .from("users")
          .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id);

        return existingUser;
      }

      // Create new user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          wallet_address: walletAddress,
          wallet_name: walletName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          trading_settings: {
            copy_size_multiplier: 1.0,
            max_copy_size: 1000,
            min_copy_size: 0.001,
          },
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      return newUser;
    } catch (error) {
      console.error("Error in createOrGetUser:", error);
      throw error;
    }
  }

  // Get user by wallet address
  static async getUserByWallet(walletAddress: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw new Error(`Failed to get user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in getUserByWallet:", error);
      throw error;
    }
  }

  // Update user settings
  static async updateUserSettings(
    userId: string,
    settings: Partial<User["trading_settings"]>
  ): Promise<User> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          trading_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user settings: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in updateUserSettings:", error);
      throw error;
    }
  }

  // Update user profile data
  static async updateUserProfile(
    userId: string,
    profileData: Partial<User["profile_data"]>
  ): Promise<User> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          profile_data: profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      throw error;
    }
  }

  // Create session
  static async createSession(
    userId: string,
    walletAddress: string
  ): Promise<UserSession> {
    try {
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const { data, error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: userId,
          wallet_address: walletAddress,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in createSession:", error);
      throw error;
    }
  }

  // Validate session
  static async validateSession(sessionToken: string): Promise<User | null> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from("user_sessions")
        .select(
          `
          *,
          users (*)
        `
        )
        .eq("session_token", sessionToken)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (sessionError || !session) {
        return null;
      }

      return session.users;
    } catch (error) {
      console.error("Error in validateSession:", error);
      return null;
    }
  }

  // Invalidate session
  static async invalidateSession(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("session_token", sessionToken);
    } catch (error) {
      console.error("Error in invalidateSession:", error);
      throw error;
    }
  }
}

// Helper function to generate session token
function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
