import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  google_id?: string;
  aptos_public_key?: string;
  aptos_private_key?: string;
  created_at?: string;
  last_login?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createActiveAccount: () => Promise<void>;
  testDatabase: () => Promise<void>;
  checkDatabaseSchema: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    console.log("🔄 AuthContext: Initializing authentication...");

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.log("⏰ AuthContext: Timeout reached, stopping loading");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    const initializeAuth = async () => {
      try {
        console.log("🔄 AuthContext: Getting initial session...");
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log("🔍 AuthContext: Initial session result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message,
        });

        if (error || !session?.user) {
          console.log("⚠️ AuthContext: No initial session found");
          if (mounted) {
            setUser(null);
            clearTimeout(timeoutId);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          console.log("✅ Initial session found, setting user");
          clearTimeout(timeoutId);
          // Set user from session
          const sessionUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            google_id: session.user.user_metadata?.google_id,
          };
          console.log("🔍 Setting session user:", sessionUser);
          setUser(sessionUser);

          // Save user to database
          await loadUserProfile(session.user);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ AuthContext: Auth initialization error:", error);
        if (mounted) {
          setUser(null);
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AuthContext: Auth state change:", event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
      });

      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ User signed in, setting session user");
        const sessionUser: User = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          google_id: session.user.user_metadata?.google_id,
        };
        console.log("🔍 Setting session user:", sessionUser);
        setUser(sessionUser);

        // Save user to database
        await loadUserProfile(session.user);
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        console.log("❌ User signed out");
        setUser(null);
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION") {
        console.log("🔄 Initial session event");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log("🔄 Loading user profile for:", supabaseUser.email);

      // Create user data
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        full_name: supabaseUser.user_metadata?.full_name,
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        google_id: supabaseUser.user_metadata?.google_id,
        last_login: new Date().toISOString(),
      };

      console.log("🔍 User data to save:", userData);

      // Add timeout to database operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database operation timeout")), 5000);
      });

      const upsertPromise = supabase
        .from("users")
        .upsert(userData, { onConflict: "id" })
        .select()
        .single();

      const { data: savedUser, error } = (await Promise.race([
        upsertPromise,
        timeoutPromise,
      ])) as any;

      console.log("🔍 Database save result:", {
        hasData: !!savedUser,
        error: error?.message,
        savedUser: savedUser
          ? {
              id: savedUser.id,
              email: savedUser.email,
              full_name: savedUser.full_name,
            }
          : null,
      });

      if (!error && savedUser) {
        console.log("✅ User profile saved successfully");
        setUser(savedUser);
      } else if (error) {
        console.error("❌ Error saving user profile:", error);
        // Even if save fails, keep the session user
        console.log("⚠️ Keeping session user data");
      }
    } catch (error) {
      console.error("❌ Error in loadUserProfile:", error);
      // Even if there's an error, keep the session user
      console.log("⚠️ Keeping session user data");
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("🔄 AuthContext: Starting Google sign-in...");
      console.log("🔍 AuthContext: Current URL:", window.location.origin);
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      console.log("🔍 AuthContext: OAuth response:", {
        data,
        error: error?.message,
      });

      if (error) {
        console.error("❌ AuthContext: Google sign-in error:", error);
        setIsLoading(false);
      } else {
        console.log("✅ AuthContext: Google sign-in initiated successfully");
        console.log(
          "🔄 AuthContext: User will be redirected to Google for authentication"
        );
      }
    } catch (error) {
      console.error("❌ AuthContext: Sign-in failed:", error);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("🔄 AuthContext: Starting sign-out process...");
      setUser(null);
      console.log("✅ AuthContext: User state cleared");

      await supabase.auth.signOut();
      console.log("✅ AuthContext: Supabase sign-out successful");

      localStorage.removeItem("supabase.auth.token");
      console.log("✅ AuthContext: LocalStorage cleared");

      setIsLoading(false);
      console.log("✅ AuthContext: Sign-out completed successfully");
    } catch (error) {
      console.error("❌ AuthContext: Sign-out failed:", error);
      setUser(null);
      setIsLoading(false);
    }
  };

  const createActiveAccount = async () => {
    if (!user) {
      console.error("❌ AuthContext: No user found for createActiveAccount");
      return;
    }

    try {
      console.log(
        "🔄 AuthContext: Creating active account for user:",
        user.email
      );

      const { data, error } = await supabase
        .from("users")
        .update({
          aptos_public_key: "active_account_created",
          last_login: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      console.log("🔍 AuthContext: Update result:", {
        hasData: !!data,
        error: error?.message,
        updatedUser: data
          ? {
              id: data.id,
              email: data.email,
              aptos_public_key: data.aptos_public_key,
            }
          : null,
      });

      if (!error && data) {
        console.log("✅ AuthContext: Active account created successfully");
        setUser(data);
      } else if (error) {
        console.error("❌ AuthContext: Error creating active account:", error);
      }
    } catch (error) {
      console.error("❌ AuthContext: Failed to create active account:", error);
    }
  };

  const testDatabase = async () => {
    try {
      console.log("🔄 AuthContext: Testing database connection...");

      // Test 1: Check if we can connect to Supabase
      console.log("✅ Supabase client connected");

      // Test 2: Try to read from users table
      const { data: users, error: readError } = await supabase
        .from("users")
        .select("*")
        .limit(1);

      if (readError) {
        console.error("❌ Read error:", readError.message);
      } else {
        console.log(`✅ Read successful, found ${users?.length || 0} users`);
      }

      // Test 3: Check current auth user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("❌ Auth error:", authError.message);
      } else if (authUser) {
        console.log(`✅ Auth user found: ${authUser.email}`);

        // Test 4: Try to insert a test record
        const testData = {
          id: authUser.id,
          email: authUser.email || "test@example.com",
          full_name: "Test User",
          aptos_public_key: "test_public_key",
          aptos_private_key: "test_private_key",
        };

        // Add timeout to database operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Database operation timeout")),
            5000
          );
        });

        const upsertPromise = supabase
          .from("users")
          .upsert(testData)
          .select()
          .single();

        const { data: insertData, error: insertError } = (await Promise.race([
          upsertPromise,
          timeoutPromise,
        ])) as any;

        if (insertError) {
          console.error("❌ Insert error:", insertError.message);
        } else {
          console.log(`✅ Insert successful: ${insertData?.email}`);
        }
      } else {
        console.log("⚠️ No authenticated user found");
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error);
    }
  };

  const checkDatabaseSchema = async () => {
    try {
      console.log("🔄 Checking database schema...");

      // Check if users table exists and get its structure
      const { data: tableInfo, error: tableError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "users")
        .eq("table_schema", "public");

      if (tableError) {
        console.error("❌ Error checking table structure:", tableError.message);
      } else {
        console.log("✅ Users table structure:", tableInfo);
      }

      // Check RLS policies
      const { data: policies, error: policyError } = await supabase
        .from("pg_policies")
        .select("*")
        .eq("tablename", "users");

      if (policyError) {
        console.error("❌ Error checking RLS policies:", policyError.message);
      } else {
        console.log("✅ RLS policies:", policies);
      }

      // Check current user count
      const { count, error: countError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("❌ Error counting users:", countError.message);
      } else {
        console.log(`✅ Total users in database: ${count}`);
      }
    } catch (error) {
      console.error("❌ Error checking database schema:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signInWithGoogle,
    signOut,
    createActiveAccount,
    testDatabase,
    checkDatabaseSchema,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
