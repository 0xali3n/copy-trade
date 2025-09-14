import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Kana Labs API Configuration
  kanaApiKey: process.env.KANA_API_KEY || "",
  kanaRestUrl: process.env.KANA_REST || "https://perps-tradeapi.kanalabs.io",
  kanaWsUrl:
    process.env.KANA_WS ||
    "wss://perpetuals-indexer-ws-develop.kanalabs.io/ws/",

  // Aptos Configuration
  aptosPrivateKeyHex: process.env.APTOS_PRIVATE_KEY_HEX || "",
  aptosAddress: process.env.APTOS_ADDRESS || "",
  aptosNodeUrl:
    process.env.APTOS_NODE || "https://fullnode.mainnet.aptoslabs.com",

  // Market Configuration
  marketId: process.env.MARKET_ID || "BTC-USD-PERP",
};

// Validation function to check required environment variables
export function validateConfig(): void {
  const required = ["KANA_API_KEY", "APTOS_PRIVATE_KEY_HEX", "APTOS_ADDRESS"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error(
      "\nPlease check your .env file and ensure all required variables are set."
    );
    process.exit(1);
  }
}

// Helper function to get current timestamp for logging
export function getTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}
