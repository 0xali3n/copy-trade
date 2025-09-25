// Kana Labs API Configuration for Frontend
export const kanaConfig = {
  // Kana Labs API Configuration
  kanaApiKey: import.meta.env.VITE_KANA_API_KEY || "",
  kanaRestUrl:
    import.meta.env.VITE_KANA_REST || "https://perps-tradeapi.kana.trade",
  kanaWsUrl:
    import.meta.env.VITE_KANA_WS ||
    "wss://perpetuals-indexer-ws.kana.trade/ws/",

  // Aptos Configuration
  aptosNodeUrl:
    import.meta.env.VITE_APTOS_NODE || "https://fullnode.mainnet.aptoslabs.com",

  // Market Configuration
  marketId: import.meta.env.VITE_MARKET_ID || "BTC-USD-PERP",
};

// Validation function to check required environment variables
export function validateKanaConfig(): { isValid: boolean; missing: string[] } {
  const required = ["VITE_KANA_API_KEY"];

  const missing = required.filter((key) => !import.meta.env[key]);

  return {
    isValid: missing.length === 0,
    missing,
  };
}

// Helper function to get current timestamp for logging
export function getTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}
