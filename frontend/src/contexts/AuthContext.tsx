import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { WalletService } from "../services/walletService";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  google_id?: string;
  aptos_wallet_address?: string;
  aptos_public_key?: string;
  aptos_private_key?: string;
  created_at?: string;
  last_login?: string;
  // New settings fields
  display_name?: string;
  bio?: string;
  twitter_username?: string;
  twitter_connected?: boolean;
  twitter_user_id?: string;
  theme?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  settings_updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createActiveAccount: () => Promise<void>;
  generateWalletForUser: (userData: User) => Promise<void>;
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

    console.log("🔄 AuthContext: Initializing authentication...");

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
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          console.log("✅ Initial session found, loading from database");

          // Load user data from database first, don't set session user immediately
          loadUserProfile(session.user).catch((error) => {
            console.error("❌ Error in loadUserProfile:", error);
            // Fallback to session user if database load fails
            const sessionUser: User = {
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
              google_id: session.user.user_metadata?.google_id,
            };
            console.log("⚠️ Using fallback session user in init:", sessionUser);
            setUser(sessionUser);
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ AuthContext: Auth initialization error:", error);
        if (mounted) {
          setUser(null);
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
        console.log("✅ User signed in, loading from database");

        // Load user data from database instead of just auth session
        loadUserProfile(session.user).catch((error) => {
          console.error("❌ Error in loadUserProfile:", error);
          // Fallback to session user if database load fails
          const sessionUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            google_id: session.user.user_metadata?.google_id,
          };
          setUser(sessionUser);
        });
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

      // First, try to load existing user from database
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      console.log("🔍 Database fetch result:", {
        hasData: !!existingUser,
        error: fetchError?.message,
        userId: supabaseUser.id,
      });

      if (existingUser && !fetchError) {
        console.log("✅ Found existing user in database:", {
          id: existingUser.id,
          email: existingUser.email,
          full_name: existingUser.full_name,
          avatar_url: existingUser.avatar_url,
          hasWallet: !!existingUser.aptos_wallet_address,
        });

        // Use the database user data (includes uploaded avatar_url and updated full_name)
        console.log("🔄 Setting user from database data:", existingUser);
        setUser(existingUser);

        // Update last_login
        await supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", supabaseUser.id);

        // Auto-generate wallet if user doesn't have one
        if (!existingUser.aptos_wallet_address) {
          console.log("🔄 User has no wallet, auto-generating...");
          generateWalletForUser(existingUser);
        } else {
          console.log("✅ User wallet exists");
        }
        return;
      }

      // If database fetch failed or no user found
      if (fetchError) {
        console.error("❌ Error fetching user from database:", fetchError);
        console.log("⚠️ Falling back to creating new user with Google data");
      } else {
        console.log("🔄 No existing user found, creating new user");
      }
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        full_name: supabaseUser.user_metadata?.full_name,
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        google_id: supabaseUser.user_metadata?.google_id,
        last_login: new Date().toISOString(),
      };

      console.log("🔍 User data to save:", userData);

      // Use upsert without timeout to prevent premature failures
      const { data: savedUser, error } = await supabase
        .from("users")
        .upsert(userData, { onConflict: "id" })
        .select()
        .single();

      console.log("🔍 Database save result:", {
        hasData: !!savedUser,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        savedUser: savedUser
          ? {
              id: savedUser.id,
              email: savedUser.email,
              full_name: savedUser.full_name,
              hasWallet: !!savedUser.aptos_wallet_address,
              walletAddress: savedUser.aptos_wallet_address,
            }
          : null,
      });

      if (!error && savedUser) {
        console.log("✅ User profile saved successfully");
        console.log("🔍 Saved user wallet data:", {
          hasWallet: !!savedUser.aptos_wallet_address,
          walletAddress: savedUser.aptos_wallet_address,
        });
        setUser(savedUser);

        // Auto-generate wallet if user doesn't have one
        if (!savedUser.aptos_wallet_address) {
          console.log("🔄 New user detected, auto-generating wallet...");
          generateWalletForUser(savedUser);
        } else {
          console.log("✅ Returning user, wallet already exists");
        }
      } else if (error) {
        console.error("❌ Error saving user profile:", error);
        // Fallback to session user
        const sessionUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          full_name: supabaseUser.user_metadata?.full_name,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          google_id: supabaseUser.user_metadata?.google_id,
        };
        console.log("⚠️ Using fallback session user:", sessionUser);
        setUser(sessionUser);
      }
    } catch (error) {
      console.error("❌ Error in loadUserProfile:", error);
      // Fallback to session user
      const sessionUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        full_name: supabaseUser.user_metadata?.full_name,
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        google_id: supabaseUser.user_metadata?.google_id,
      };
      console.log("⚠️ Using catch fallback session user:", sessionUser);
      setUser(sessionUser);
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

  const generateWalletForUser = async (userData: User) => {
    try {
      console.log("🔄 Auto-generating wallet for new user:", userData.email);

      // Generate new Aptos wallet
      const walletInfo = WalletService.generateWallet();

      console.log("🔍 Generated wallet info:", {
        address: walletInfo.address,
        addressLength: walletInfo.address.length,
        publicKey: walletInfo.publicKey,
        publicKeyLength: walletInfo.publicKey.length,
        privateKeyLength: walletInfo.privateKey.length,
      });
      console.log(
        "🎯 IMPORTANT: Use this ADDRESS to send money:",
        walletInfo.address
      );
      console.log(
        "⚠️  Public key is NOT an address - don't use it for transactions!"
      );

      // Verify the private key generates the same address
      const isVerified = WalletService.verifyPrivateKey(
        walletInfo.privateKey,
        walletInfo.address
      );
      if (!isVerified) {
        console.error(
          "🚨 CRITICAL: Private key does not generate the expected address!"
        );
      } else {
        console.log(
          "✅ Verification passed: Private key generates correct address"
        );
      }

      // Save wallet to database
      console.log("🔄 Saving wallet to database...");
      const { data, error } = await supabase
        .from("users")
        .update({
          aptos_wallet_address: walletInfo.address,
          aptos_public_key: walletInfo.publicKey,
          aptos_private_key: walletInfo.privateKey,
          last_login: new Date().toISOString(),
        })
        .eq("id", userData.id)
        .select()
        .single();

      console.log("🔍 Database update result:", {
        hasData: !!data,
        error: error?.message,
        updatedUser: data
          ? {
              id: data.id,
              email: data.email,
              aptos_wallet_address: data.aptos_wallet_address,
              aptos_public_key: data.aptos_public_key,
            }
          : null,
      });

      if (!error && data) {
        console.log("✅ Wallet auto-generated and saved successfully");
        setUser(data);
      } else if (error) {
        console.error("❌ Error auto-generating wallet:", error);
      }
    } catch (error) {
      console.error("❌ Failed to auto-generate wallet:", error);
    }
  };

  const createActiveAccount = async () => {
    if (!user) {
      console.error("❌ No user found for createActiveAccount");
      return;
    }

    try {
      console.log("🔄 Creating active account for user:", user.email);
      console.log("🔄 Current user state:", {
        id: user.id,
        email: user.email,
        hasWallet: !!user.aptos_wallet_address,
      });

      // Check if user already has a wallet
      if (user.aptos_wallet_address) {
        console.log("⚠️ User already has a wallet:", user.aptos_wallet_address);
        console.log("✅ Wallet already exists, no need to create a new one");

        // Just update last login time
        const { data, error } = await supabase
          .from("users")
          .update({
            last_login: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

        if (!error && data) {
          console.log("✅ Last login time updated");
          setUser(data);
        } else if (error) {
          console.error("❌ Error updating last login:", error);
        }
        return;
      }

      // Generate new Aptos wallet
      console.log("🔄 Generating new Aptos wallet...");
      const walletInfo = WalletService.generateWallet();

      console.log("🔍 Generated wallet info:", {
        address: walletInfo.address,
        addressLength: walletInfo.address.length,
        publicKey: walletInfo.publicKey,
        publicKeyLength: walletInfo.publicKey.length,
        privateKeyLength: walletInfo.privateKey.length,
      });
      console.log(
        "🎯 IMPORTANT: Use this ADDRESS to send money:",
        walletInfo.address
      );
      console.log(
        "⚠️  Public key is NOT an address - don't use it for transactions!"
      );

      // Verify the private key generates the same address
      const isVerified = WalletService.verifyPrivateKey(
        walletInfo.privateKey,
        walletInfo.address
      );
      if (!isVerified) {
        console.error(
          "🚨 CRITICAL: Private key does not generate the expected address!"
        );
      } else {
        console.log(
          "✅ Verification passed: Private key generates correct address"
        );
      }

      // Save wallet to database
      console.log("🔄 Saving wallet to database...");
      const { data, error } = await supabase
        .from("users")
        .update({
          aptos_wallet_address: walletInfo.address,
          aptos_public_key: walletInfo.publicKey,
          aptos_private_key: walletInfo.privateKey,
          last_login: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      console.log("🔍 Database update result:", {
        hasData: !!data,
        error: error?.message,
        updatedUser: data
          ? {
              id: data.id,
              email: data.email,
              aptos_wallet_address: data.aptos_wallet_address,
              aptos_public_key: data.aptos_public_key,
            }
          : null,
      });

      if (!error && data) {
        console.log("✅ Active account with Aptos wallet created successfully");
        setUser(data);
      } else if (error) {
        console.error("❌ Error creating active account:", error);
      }
    } catch (error) {
      console.error("❌ Failed to create active account:", error);
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
    generateWalletForUser,
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
