import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Ed25519PrivateKey, Account } from "@aptos-labs/ts-sdk";
import { createClient } from "@supabase/supabase-js";

// Supabase client - Use anon key with different options
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Types
export interface User {
  wallet_address: string;
  wallet_name?: string;
  aptos_wallet_address?: string;
  aptos_public_key?: string;
  aptos_private_key?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  createActiveAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { account, connected } = useWallet();

  const isAuthenticated = !!user;

  // Auto-set user when wallet connects and check for existing active account
  useEffect(() => {
    if (connected && account?.address) {
      handleWalletConnect();
    } else {
      setUser(null);
    }
  }, [connected, account]);

  const handleWalletConnect = async () => {
    if (!account?.address) return;

    try {
      setIsLoading(true);

      // Check Supabase directly (no localStorage)

      // Check Supabase for existing user
      console.log("Checking Supabase for existing user...");
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", account.address.toString())
        .single();

      if (existingUser && !error) {
        // User exists in Supabase, load their data
        const userData: User = {
          wallet_address: existingUser.wallet_address,
          wallet_name: existingUser.wallet_name,
          aptos_wallet_address: existingUser.aptos_wallet_address,
          aptos_public_key: existingUser.aptos_public_key,
          aptos_private_key: existingUser.aptos_private_key,
        };
        setUser(userData);
        console.log(
          "✅ Loaded existing user from Supabase:",
          existingUser.aptos_wallet_address
            ? "Has active account"
            : "No active account"
        );
        return;
      }

      // New user, just set basic wallet info
      const userData: User = {
        wallet_address: account.address.toString(),
        wallet_name: account.publicKey?.toString(),
      };
      setUser(userData);
      console.log("New user connected, no active account yet");
    } catch (error) {
      console.error("Error checking user:", error);
      // Fallback to basic wallet info
      const userData: User = {
        wallet_address: account.address.toString(),
        wallet_name: account.publicKey?.toString(),
      };
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const createActiveAccount = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log("Creating Aptos account...");

      // Generate new Aptos account
      const privateKey = Ed25519PrivateKey.generate();
      const publicKey = privateKey.publicKey();
      const account = Account.fromPrivateKey({ privateKey });

      const walletAddress = account.accountAddress.toString();
      const publicKeyHex = publicKey.toString();
      const privateKeyHex = privateKey.toString();

      console.log("=== APTOS WALLET CREATED ===");
      console.log("Wallet Address:", walletAddress);
      console.log("Public Key:", publicKeyHex);
      console.log("Private Key:", privateKeyHex);
      console.log("=============================");

      // Store in Supabase - Try INSERT first
      console.log("Storing in Supabase...");
      const { data, error } = await supabase
        .from("users")
        .insert({
          wallet_address: user.wallet_address,
          aptos_wallet_address: walletAddress,
          aptos_public_key: publicKeyHex,
          aptos_private_key: privateKeyHex,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase error:", error);
        throw new Error("Failed to save active account: " + error.message);
      }

      console.log("✅ Stored in Supabase:", data);

      // Update user state with Supabase data
      const updatedUser = {
        ...user,
        aptos_wallet_address: walletAddress,
        aptos_public_key: publicKeyHex,
        aptos_private_key: privateKeyHex,
      };

      setUser(updatedUser);

      console.log("✅ Active account created and stored:", walletAddress);
    } catch (error) {
      console.error("Create active account error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
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
