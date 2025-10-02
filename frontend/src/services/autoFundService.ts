/**
 * Auto Fund Service
 * Automatically funds new wallets with 0.1 APT for gas fees
 * Only funds once per wallet to avoid repeated transactions
 */

import {
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  Account,
} from "@aptos-labs/ts-sdk";
import { supabase } from "../lib/supabase";

// Get gas wallet private key from environment
const getGasWalletPrivateKey = () =>
  import.meta.env.VITE_GAS_WALLET_PRIVATE_KEY;

export class AutoFundService {
  private aptos: Aptos;
  private gasAccount: Account | null = null;
  private isInitialized = false;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);
  }

  // Initialize with gas wallet private key
  initialize(): boolean {
    try {
      const gasWalletPrivateKey = getGasWalletPrivateKey();

      if (!gasWalletPrivateKey) {
        console.error(
          "[AutoFund] ❌ VITE_GAS_WALLET_PRIVATE_KEY not configured"
        );
        return false;
      }

      console.log("[AutoFund] Initializing with gas wallet...");

      // Add prefix back if it's missing
      const fullPrivateKey = gasWalletPrivateKey.startsWith("ed25519-priv-")
        ? gasWalletPrivateKey
        : `ed25519-priv-${gasWalletPrivateKey}`;

      const privateKey = new Ed25519PrivateKey(fullPrivateKey);
      this.gasAccount = Account.fromPrivateKey({ privateKey });

      this.isInitialized = true;
      console.log("[AutoFund] ✅ Initialized successfully");
      console.log(
        `[AutoFund] Gas wallet: ${this.gasAccount.accountAddress.toString()}`
      );

      return true;
    } catch (error) {
      console.error("[AutoFund] ❌ Initialization failed:", error);
      this.isInitialized = false;
      return false;
    }
  }

  // Check if wallet has been funded before
  async hasWalletBeenFunded(walletAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("gas_funded")
        .eq("aptos_wallet_address", walletAddress)
        .single();

      if (error) {
        return false;
      }

      const hasBeenFunded = data?.gas_funded === true;
      if (hasBeenFunded) {
        console.log(`[AutoFund] Wallet already funded`);
      }
      return hasBeenFunded;
    } catch (error) {
      console.error("[AutoFund] Error checking funding status:", error);
      return false;
    }
  }

  // Mark wallet as funded in database
  async markWalletAsFunded(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ gas_funded: true })
        .eq("aptos_wallet_address", walletAddress);

      if (error) {
        console.error("[AutoFund] Error marking wallet as funded:", error);
      } else {
        console.log(`[AutoFund] ✅ Marked wallet ${walletAddress} as funded`);
      }
    } catch (error) {
      console.error("[AutoFund] Error updating funding status:", error);
    }
  }

  // Check current APT balance of a wallet
  async getWalletAptBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress: walletAddress,
      });

      const aptBalance = Number(balance) / 100000000; // Convert from octas to APT
      return aptBalance;
    } catch (error) {
      console.error("[AutoFund] Error getting APT balance:", error);
      return 0;
    }
  }

  // Send 0.1 APT to a wallet
  async fundWallet(walletAddress: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    if (!this.isInitialized || !this.gasAccount) {
      return { success: false, error: "AutoFund service not initialized" };
    }

    try {
      console.log(`[AutoFund] Funding wallet ${walletAddress} with 0.1 APT...`);

      // Check gas wallet balance first
      const gasBalance = await this.getWalletAptBalance(
        this.gasAccount.accountAddress.toString()
      );
      console.log(
        `[AutoFund] Gas wallet balance: ${gasBalance.toFixed(6)} APT`
      );

      if (gasBalance < 0.2) {
        console.error(
          `[AutoFund] ❌ Gas wallet insufficient balance: ${gasBalance.toFixed(
            6
          )} APT`
        );
        return {
          success: false,
          error: `Gas wallet has insufficient balance: ${gasBalance.toFixed(
            6
          )} APT (need at least 0.2 APT). Please fund the gas wallet first.`,
        };
      }

      // Send 0.1 APT (10,000,000 octas)
      const amount = 10000000; // 0.1 APT in octas

      const transaction = await this.aptos.transaction.build.simple({
        sender: this.gasAccount.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [walletAddress, amount],
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

      console.log(`[AutoFund] ✅ Successfully funded wallet ${walletAddress}`);
      console.log(`[AutoFund] Transaction: ${committedTxn.hash}`);

      // Mark wallet as funded
      await this.markWalletAsFunded(walletAddress);

      return {
        success: true,
        txHash: committedTxn.hash,
      };
    } catch (error: any) {
      console.error("[AutoFund] ❌ Funding failed:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  }

  // Main function: Check and fund wallet if needed
  async checkAndFundWallet(walletAddress: string): Promise<{
    funded: boolean;
    txHash?: string;
    error?: string;
    message: string;
  }> {
    try {
      // Check if wallet has been funded before
      const hasBeenFunded = await this.hasWalletBeenFunded(walletAddress);
      if (hasBeenFunded) {
        return {
          funded: false,
          message: "Wallet already funded",
        };
      }

      // Check current APT balance
      const currentBalance = await this.getWalletAptBalance(walletAddress);
      if (currentBalance >= 0.05) {
        // Has enough APT (0.05 APT is enough for many transactions)
        // Mark as funded even though we didn't send, to avoid future checks
        await this.markWalletAsFunded(walletAddress);
        return {
          funded: false,
          message: "Wallet has sufficient APT balance",
        };
      }

      // Wallet needs funding
      console.log(
        `[AutoFund] Funding wallet with 0.1 APT (current: ${currentBalance.toFixed(
          6
        )} APT)`
      );
      const result = await this.fundWallet(walletAddress);

      if (result.success) {
        return {
          funded: true,
          txHash: result.txHash,
          message: "Wallet funded successfully with 0.1 APT",
        };
      } else {
        return {
          funded: false,
          error: result.error,
          message: `Funding failed: ${result.error}`,
        };
      }
    } catch (error: any) {
      console.error("[AutoFund] Error in checkAndFundWallet:", error);
      return {
        funded: false,
        error: error.message || "Unknown error",
        message: "Error checking/funding wallet",
      };
    }
  }

  // Check if service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized && !!this.gasAccount;
  }
}

// Check if gas wallet is configured
export const isAutoFundConfigured = (): boolean => {
  return !!getGasWalletPrivateKey();
};
