/**
 * Debug Service - Simple console logging for debugging
 * Shows step by step what's happening
 */

import {
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  Account,
} from "@aptos-labs/ts-sdk";

// Get gas wallet private key from environment
const getGasWalletPrivateKey = () =>
  import.meta.env.VITE_GAS_WALLET_PRIVATE_KEY;

export class DebugService {
  private aptos: Aptos;
  private gasAccount: Account | null = null;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);
  }

  // Step 1: Check gas wallet balance
  async checkGasWalletBalance(): Promise<number> {
    console.log("🔍 STEP 1: Checking gas wallet balance...");

    const gasWalletPrivateKey = getGasWalletPrivateKey();
    console.log(
      "🔑 Gas wallet private key from env:",
      gasWalletPrivateKey ? "✅ Found" : "❌ Not found"
    );
    console.log("🔑 Private key length:", gasWalletPrivateKey?.length || 0);

    if (!gasWalletPrivateKey) {
      console.log("❌ Gas wallet private key not configured");
      console.log(
        "💡 Make sure you have VITE_GAS_WALLET_PRIVATE_KEY in your .env file"
      );
      return 0;
    }

    try {
      const fullPrivateKey = gasWalletPrivateKey.startsWith("ed25519-priv-")
        ? gasWalletPrivateKey
        : `ed25519-priv-${gasWalletPrivateKey}`;

      console.log(
        "🔑 Full private key format:",
        fullPrivateKey.substring(0, 20) + "..."
      );

      const privateKey = new Ed25519PrivateKey(fullPrivateKey);
      this.gasAccount = Account.fromPrivateKey({ privateKey });

      const gasWalletAddress = this.gasAccount.accountAddress.toString();
      console.log(`📍 Gas wallet address: ${gasWalletAddress}`);

      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress: this.gasAccount.accountAddress,
      });

      const aptBalance = Number(balance) / 100000000;
      console.log(`💰 Gas wallet balance: ${aptBalance.toFixed(6)} APT`);

      if (aptBalance < 0.2) {
        console.log("❌ Gas wallet has insufficient balance!");
        console.log(
          `   Need at least 0.2 APT, have ${aptBalance.toFixed(6)} APT`
        );
        console.log(`   Send APT to: ${gasWalletAddress}`);
      } else {
        console.log("✅ Gas wallet has sufficient balance");
      }

      return aptBalance;
    } catch (error) {
      console.log("❌ Error checking gas wallet:", error);
      return 0;
    }
  }

  // Step 2: Check user wallet balance
  async checkUserWalletBalance(userWalletAddress: string): Promise<number> {
    console.log("🔍 STEP 2: Checking user wallet balance...");
    console.log(`📍 User wallet: ${userWalletAddress}`);

    try {
      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress: userWalletAddress,
      });

      const aptBalance = Number(balance) / 100000000;
      console.log(`💰 User wallet APT balance: ${aptBalance.toFixed(6)} APT`);

      if (aptBalance < 0.05) {
        console.log("⚠️ User wallet needs APT for gas fees");
        return aptBalance;
      } else {
        console.log("✅ User wallet has sufficient APT");
        return aptBalance;
      }
    } catch (error) {
      console.log("❌ Error checking user wallet:", error);
      return 0;
    }
  }

  // Step 3: Send 0.1 APT to user wallet
  async sendAptToUser(userWalletAddress: string): Promise<boolean> {
    console.log("🔍 STEP 3: Sending 0.1 APT to user wallet...");

    if (!this.gasAccount) {
      console.log("❌ Gas account not initialized");
      return false;
    }

    try {
      const amount = 10000000; // 0.1 APT in octas (10,000,000 octas = 0.1 APT)
      console.log(
        `💸 Sending 0.1 APT (${amount} octas) to ${userWalletAddress}`
      );

      const transaction = await this.aptos.transaction.build.simple({
        sender: this.gasAccount.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [userWalletAddress, amount],
        },
      });

      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction,
          signer: this.gasAccount,
        });

      await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      console.log("✅ Successfully sent 0.1 APT to user wallet");
      console.log(`📝 Transaction: ${committedTxn.hash}`);
      console.log(
        `💰 Amount sent: ${amount} octas = ${amount / 100000000} APT`
      );
      return true;
    } catch (error) {
      console.log("❌ Error sending APT to user:", error);
      return false;
    }
  }

  // Step 4: Check USDT balance using Kana API
  async checkUsdtBalance(userWalletAddress: string): Promise<number> {
    console.log("🔍 STEP 4: Checking USDT balance...");

    try {
      const apiKey = import.meta.env.VITE_KANA_API_KEY;
      const baseUrl =
        import.meta.env.VITE_KANA_BASE_URL ||
        "https://perps-tradeapi.kana.trade";

      const response = await fetch(
        `${baseUrl}/getWalletAccountBalance?userAddress=${userWalletAddress}`,
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log(`💰 User wallet USDT balance: $${data.data.toFixed(2)}`);
        return data.data;
      } else {
        console.log("❌ Error getting USDT balance:", data.message);
        return 0;
      }
    } catch (error) {
      console.log("❌ Error checking USDT balance:", error);
      return 0;
    }
  }

  // Complete flow: Check everything and fund if needed
  async debugCompleteFlow(userWalletAddress: string): Promise<void> {
    console.log("🚀 STARTING DEBUG FLOW...");
    console.log("=".repeat(50));

    // Step 1: Check gas wallet
    const gasBalance = await this.checkGasWalletBalance();
    if (gasBalance < 0.2) {
      console.log("❌ STOPPING: Gas wallet needs funding first");
      return;
    }

    // Step 2: Check user wallet APT
    const userAptBalance = await this.checkUserWalletBalance(userWalletAddress);

    // Step 3: Send APT if needed
    if (userAptBalance < 0.05) {
      console.log("🔧 User needs APT, sending 0.1 APT...");
      const sent = await this.sendAptToUser(userWalletAddress);
      if (!sent) {
        console.log("❌ STOPPING: Failed to send APT to user");
        return;
      }
    } else {
      console.log("✅ User already has sufficient APT");
    }

    // Step 4: Check USDT balance
    const usdtBalance = await this.checkUsdtBalance(userWalletAddress);

    if (usdtBalance > 0) {
      console.log(
        `💰 Found $${usdtBalance.toFixed(
          2
        )} USDT - ready for transfer to trading account`
      );
    } else {
      console.log("ℹ️ No USDT found in wallet");
    }

    console.log("=".repeat(50));
    console.log("🏁 DEBUG FLOW COMPLETE");
  }
}
