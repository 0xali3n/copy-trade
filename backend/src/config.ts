import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || "",

  // Kana Labs API Configuration
  kanaApiKey: process.env.KANA_API_KEY || "",
  kanaRestUrl: process.env.KANA_REST || "https://perps-tradeapi.kana.trade",
  kanaWsUrl:
    process.env.KANA_WS || "wss://perpetuals-indexer-ws.kana.trade/ws/",

  // Aptos Configuration
  aptosNode: process.env.APTOS_NODE || "https://fullnode.mainnet.aptoslabs.com",
  aptosNetwork: process.env.APTOS_NETWORK || "mainnet",
  marketId: process.env.MARKET_ID || "15",

  // Gas Wallet Configuration
  gasWalletPrivateKey: process.env.GAS_WALLET_PRIVATE_KEY || "",
};

// Validation function to check if all required environment variables are set
export function validateConfig(): void {
  const requiredVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "KANA_API_KEY",
    "GAS_WALLET_PRIVATE_KEY",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// Helper function to get current timestamp for logging
export function getTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}
