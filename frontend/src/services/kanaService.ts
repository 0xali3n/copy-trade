import {
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  Account,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { kanaGet } from "../lib/kanaClient";
// Removed unused import

export class KanaService {
  private aptos: Aptos;
  private account: Account | null = null;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);
  }

  /**
   * Initialize the service with a private key from database
   */
  initializeWithPrivateKey(privateKeyHex: string): boolean {
    try {
      // Remove ed25519-priv- prefix if present
      let cleanPrivateKey = privateKeyHex;
      if (privateKeyHex.startsWith("ed25519-priv-")) {
        cleanPrivateKey = privateKeyHex.replace("ed25519-priv-", "");
      }

      // Format the private key
      const formattedPrivateKey = PrivateKey.formatPrivateKey(
        cleanPrivateKey,
        "ed25519" as PrivateKeyVariants
      );

      this.account = Account.fromPrivateKey({
        privateKey: new Ed25519PrivateKey(formattedPrivateKey),
      });

      // KanaService initialized
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.account !== null;
  }

  /**
   * Get wallet account balance
   */
  async getWalletAccountBalance(): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
  }> {
    if (!this.account) {
      return {
        success: false,
        error: "Kana service not initialized",
      };
    }

    try {
      const response = await kanaGet(
        `/getWalletAccountBalance?userAddress=${this.account.accountAddress.toString()}`
      );

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API error: ${response.data?.message || "Unknown error"}`,
        };
      }

      return {
        success: true,
        balance: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get wallet balance",
      };
    }
  }

  /**
   * Get profile balance snapshot
   */
  async getProfileBalanceSnapshot(): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
  }> {
    if (!this.account) {
      return {
        success: false,
        error: "Kana service not initialized",
      };
    }

    try {
      const response = await kanaGet(
        `/getProfileBalanceSnapshot?userAddress=${this.account.accountAddress.toString()}`
      );

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API error: ${response.data?.message || "Unknown error"}`,
        };
      }

      return {
        success: true,
        balance: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get profile balance",
      };
    }
  }

  /**
   * Test connection to Kana Labs API
   */
  async testConnection(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    if (!this.account) {
      return {
        success: false,
        error: "Kana service not initialized",
      };
    }

    try {
      const balanceResult = await this.getWalletAccountBalance();
      if (balanceResult.success) {
        return {
          success: true,
          message: `✅ Connected! Balance: $${balanceResult.balance?.toFixed(
            2
          )}`,
        };
      } else {
        return {
          success: false,
          error: `Connection failed: ${balanceResult.error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  /**
   * Deposit funds to trading account
   */
  async depositFunds(
    amount: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    if (!this.account) {
      return {
        success: false,
        error: "Kana service not initialized",
      };
    }

    try {
      console.log(`💰 Depositing $${amount} to trading account...`);

      // Step 1: Get deposit transaction payload from Kana Labs API
      const response = await kanaGet(
        `/deposit?userAddress=${this.account.accountAddress.toString()}&amount=${amount}`
      );

      if (response.error) {
        return {
          success: false,
          error: `Failed to get deposit payload: ${response.error}`,
        };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API error: ${response.data?.message || "Unknown error"}`,
        };
      }

      console.log("✅ Deposit payload received");

      // Step 2: Submit deposit transaction to Aptos blockchain
      const transactionResult = await this.submitDepositTransaction(
        response.data.data
      );
      if (!transactionResult.success) {
        return {
          success: false,
          error: transactionResult.error,
        };
      }

      console.log("✅ Deposit successful!");
      return {
        success: true,
        transactionHash: transactionResult.transactionHash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Deposit failed",
      };
    }
  }

  private async submitDepositTransaction(
    payloadData: any
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log("🚀 Submitting transaction to blockchain...");

      // Build transaction using the payload from Kana Labs
      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: this.account!.accountAddress,
        data: payloadData,
      });

      // Sign and submit transaction
      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: this.account!,
        });

      console.log(`✅ Transaction submitted: ${committedTxn.hash}`);

      // Wait for transaction confirmation
      const response = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (response.success) {
        return {
          success: true,
          transactionHash: committedTxn.hash,
        };
      } else {
        return {
          success: false,
          error: "Transaction failed on blockchain",
        };
      }
    } catch (error) {
      console.error("❌ Transaction error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Transaction submission failed",
      };
    }
  }

  /**
   * Get account address
   */
  getAccountAddress(): string | null {
    return this.account?.accountAddress.toString() || null;
  }
}
