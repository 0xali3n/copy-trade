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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Clean up URL parameters after authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams =
      urlParams.has("code") ||
      urlParams.has("state") ||
      urlParams.has("access_token");

    if (hasAuthParams) {
      // Clean up the URL by removing auth parameters
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Initialize auth state and listen for auth changes
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.user) {
          if (mounted) {
            setUser(null);
            clearTimeout(timeoutId);
            setIsLoading(false);
          }
          return;
        }
        if (mounted) {
          clearTimeout(timeoutId);

          // Set user immediately from session data
          const sessionUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            google_id: session.user.user_metadata?.google_id,
          };
          setUser(sessionUser);

          // Then try to load profile from database
          await loadUserProfile(session.user);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        // Set user immediately from session data
        const sessionUser: User = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          google_id: session.user.user_metadata?.google_id,
        };
        setUser(sessionUser);

        // Then try to load profile from database
        await loadUserProfile(session.user);
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsLoading(false);
      } else if (event === "TOKEN_REFRESHED") {
        // Don't change loading state for token refresh
      }
      // Don't handle INITIAL_SESSION here as it's handled in getInitialSession
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Quick database query
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      if (!error && userProfile) {
        setUser(userProfile);
      }
    } catch (error) {
      // User is already set from session data, no need to set again
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Google sign-in error:", error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Sign-in failed:", error);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear user state immediately
      setUser(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign-out error:", error);
      }

      // Clear localStorage
      localStorage.removeItem("supabase.auth.token");

      setIsLoading(false);
    } catch (error) {
      console.error("Sign-out failed:", error);
      setUser(null);
      setIsLoading(false);
    }
  };

  const createActiveAccount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          aptos_public_key: "active_account_created",
          last_login: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error creating active account:", error);
        return;
      }

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to create active account:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signInWithGoogle,
    signOut,
    createActiveAccount,
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
