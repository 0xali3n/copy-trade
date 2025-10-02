import { supabase } from "../lib/supabase";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  post_type: "text" | "image" | "trade" | "poll";

  // Trade specific fields
  trade_symbol?: string;
  trade_side?: "long" | "short";
  trade_leverage?: number;
  trade_entry_price?: number;
  trade_quantity?: number;
  trade_status?: "open" | "closed";
  trade_closing_price?: number;

  // Poll specific fields
  poll_question?: string;
  poll_options?: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  poll_total_votes?: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // User data (joined from users table)
  users?: {
    full_name: string;
    avatar_url?: string;
    aptos_wallet_address?: string;
    twitter_username?: string;
  };
}

export interface CreatePostData {
  content: string;
  image_url?: string;
  post_type: "text" | "image" | "trade" | "poll";

  // Trade specific fields
  trade_symbol?: string;
  trade_side?: "long" | "short";
  trade_leverage?: number;
  trade_entry_price?: number;
  trade_quantity?: number;
  trade_status?: "open" | "closed";
  trade_closing_price?: number;

  // Poll specific fields
  poll_question?: string;
  poll_options?: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  poll_total_votes?: number;
}

export class PostsService {
  // Get all posts with user data
  static async getPosts(
    limit: number = 50,
    offset: number = 0
  ): Promise<Post[]> {
    try {
      // Get posts with user data from custom users table
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          users!posts_user_id_fkey (
            full_name,
            avatar_url,
            aptos_wallet_address,
            twitter_username
          )
        `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching posts with user data:", error);

        // If that fails, try to get posts without user data
        console.log("Trying to fetch posts without user data...");
        const { data: simpleData, error: simpleError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (simpleError) {
          console.error("Error fetching posts without user data:", simpleError);
          throw simpleError;
        }

        return simpleData || [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getPosts:", error);
      throw error;
    }
  }

  // Create a new post
  static async createPost(postData: CreatePostData): Promise<Post> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("🔍 User ID for post creation:", user.id);
      console.log("🔍 User email:", user.email);

      // First try to insert with user data
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          ...postData,
        })
        .select(
          `
          *,
          users!posts_user_id_fkey (
            full_name,
            avatar_url,
            aptos_wallet_address,
            twitter_username
          )
        `
        )
        .single();

      // If that fails, try without user data
      if (error) {
        console.error("Error creating post with user data:", error);
        console.log("Trying to create post without user data...");

        const { data: simpleData, error: simpleError } = await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            ...postData,
          })
          .select("*")
          .single();

        if (simpleError) {
          console.error("Error creating post without user data:", simpleError);
          throw simpleError;
        }

        return simpleData;
      }

      return data;
    } catch (error) {
      console.error("Error in createPost:", error);
      throw error;
    }
  }

  // Subscribe to real-time post updates
  static subscribeToPosts(callback: (payload: any) => void) {
    return supabase
      .channel("posts_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        callback
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
        },
        callback
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
        },
        callback
      )
      .subscribe();
  }
}
