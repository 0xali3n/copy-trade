/**
 * Simple Kana Labs Service
 * All Kana Labs functionality in one clean file
 */

import {
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  Account,
} from "@aptos-labs/ts-sdk";

// Get API key from environment
const getApiKey = () => import.meta.env.VITE_KANA_API_KEY;
const getBaseUrl = () =>
  import.meta.env.VITE_KANA_BASE_URL || "https://perps-tradeapi.kana.trade";

// Simple API call function
async function kanaApiCall(endpoint: string) {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();

  if (!apiKey) {
    throw new Error("KANA_API_KEY not configured");
  }

  const url = `${baseUrl}${endpoint}`;
  console.log(`[Kana] Making request to: ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      `[Kana] API Error: ${response.status} - ${
        data.message || data.error || "Unknown error"
      }`
    );
    throw new Error(data.message || data.error || `HTTP ${response.status}`);
  }

  console.log(`[Kana] ✅ Success: ${endpoint}`);
  return data;
}

// Simple Kana Service Class
export class KanaService {
  private aptos: Aptos;
  private account: Account | null = null;
  private isInitialized = false;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);
  }

  // Initialize with user's private key
  initialize(privateKeyHex: string): boolean {
    try {
      console.log("[Kana] Initializing with private key...");

      const privateKey = new Ed25519PrivateKey(privateKeyHex);
      this.account = Account.fromPrivateKey({ privateKey });

      this.isInitialized = true;
      console.log("[Kana] ✅ Initialized successfully");
      console.log(`[Kana] Account: ${this.account.accountAddress.toString()}`);

      return true;
    } catch (error) {
      console.error("[Kana] ❌ Initialization failed:", error);
      this.isInitialized = false;
      return false;
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<number> {
    if (!this.isInitialized || !this.account) {
      throw new Error("Kana service not initialized");
    }

    const data = await kanaApiCall(
      `/getWalletAccountBalance?userAddress=${this.account.accountAddress.toString()}`
    );

    if (!data.success) {
      throw new Error(data.message || "Failed to get wallet balance");
    }

    console.log(`[Kana] ✅ Wallet Balance: $${data.data.toFixed(2)}`);
    return data.data;
  }

  // Get trading balance
  async getTradingBalance(): Promise<number> {
    if (!this.isInitialized || !this.account) {
      throw new Error("Kana service not initialized");
    }

    const data = await kanaApiCall(
      `/getProfileBalanceSnapshot?userAddress=${this.account.accountAddress.toString()}`
    );

    if (!data.success) {
      throw new Error(data.message || "Failed to get trading balance");
    }

    console.log(`[Kana] ✅ Trading Balance: $${data.data.toFixed(6)}`);
    return data.data;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      console.log("[Kana] Testing connection...");

      // Try to get profile with a test address
      await kanaApiCall("/getProfileAddress?userAddress=0x1");
      return true;
    } catch (error) {
      // 400 is expected for invalid address, means API is working
      if (error instanceof Error && error.message.includes("400")) {
        console.log(
          "[Kana] ✅ Connection test successful (expected 400 for test address)"
        );
        return true;
      }
      console.error("[Kana] ❌ Connection test failed:", error);
      return false;
    }
  }

  // Deposit funds
  async deposit(amount: number): Promise<string> {
    if (!this.isInitialized || !this.account) {
      throw new Error("Kana service not initialized");
    }

    console.log(`[Kana] Depositing $${amount.toFixed(2)}...`);

    // Step 1: Get deposit payload
    const payloadData = await kanaApiCall(
      `/deposit?userAddress=${this.account.accountAddress.toString()}&amount=${amount}`
    );

    if (!payloadData.success) {
      throw new Error(payloadData.message || "Failed to get deposit payload");
    }

    console.log("[Kana] ✅ Deposit payload received");

    // Step 2: Submit transaction
    const transactionPayload = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: payloadData.data,
    });

    const committedTxn = await this.aptos.transaction.signAndSubmitTransaction({
      transaction: transactionPayload,
      signer: this.account,
    });

    await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log(
      `[Kana] ✅ Deposit successful! Transaction: ${committedTxn.hash}`
    );
    return committedTxn.hash;
  }

  // Get both balances
  async getBalances(): Promise<{ wallet: number; trading: number }> {
    const [wallet, trading] = await Promise.all([
      this.getWalletBalance().catch(() => 0),
      this.getTradingBalance().catch(() => 0),
    ]);

    return { wallet, trading };
  }

  // Check if the service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized && !!this.account;
  }
}

// Check if API key is configured
export const isKanaConfigured = (): boolean => {
  return !!getApiKey();
};
