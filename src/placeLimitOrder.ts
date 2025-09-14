import { config, validateConfig, getTimestamp } from "./config";
import { kanaGet } from "./kanaClient";
import {
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  Account,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";

/**
 * BTC Limit Order Placement Script for Kana Labs Perps
 *
 * Focus: BTC/USDC only with realistic prices around current market
 * Current BTC Market: Ask $1,140.50 | Bid $1,112.68 | Mid $1,126.59
 */

interface LimitOrderParams {
  marketId: string;
  tradeSide: boolean; // true = long, false = short
  direction: boolean; // false = open position, true = close position
  size: number;
  price: number;
  leverage: number;
  restriction?: number; // 0 = NO_RESTRICTION, 1 = FILL_OR_ABORT, 3 = POST_OR_ABORT
  takeProfit?: number;
  stopLoss?: number;
}

interface OrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  orderData?: any;
}

class BtcLimitOrderPlacer {
  private aptos: Aptos;
  private account: Account;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);

    // Create account from private key
    const formattedPrivateKey = PrivateKey.formatPrivateKey(
      config.aptosPrivateKeyHex,
      "ed25519" as PrivateKeyVariants
    );
    this.account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(formattedPrivateKey),
    });
  }

  async placeLimitOrder(params: LimitOrderParams): Promise<OrderResult> {
    try {
      const payloadResult = await this.getTransactionPayload(params);
      if (!payloadResult.success) {
        return {
          success: false,
          error: payloadResult.error,
        };
      }

      const transactionResult = await this.submitTransaction(
        payloadResult.data
      );
      if (!transactionResult.success) {
        return {
          success: false,
          error: transactionResult.error,
        };
      }

      return {
        success: true,
        transactionHash: transactionResult.transactionHash,
        orderData: payloadResult.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async getTransactionPayload(
    params: LimitOrderParams
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        marketId: params.marketId,
        tradeSide: params.tradeSide.toString(),
        direction: params.direction.toString(),
        size: params.size.toString(),
        price: params.price.toString(),
        leverage: params.leverage.toString(),
      });

      // Add optional parameters if provided
      if (params.restriction !== undefined) {
        queryParams.append("restriction", params.restriction.toString());
      }
      if (params.takeProfit !== undefined) {
        queryParams.append("takeProfit", params.takeProfit.toString());
      }
      if (params.stopLoss !== undefined) {
        queryParams.append("stopLoss", params.stopLoss.toString());
      }

      const response = await kanaGet(
        `/placeLimitOrder?${queryParams.toString()}`
      );

      if (response.error) {
        return {
          success: false,
          error: `Failed to get transaction payload: ${response.error}`,
        };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API returned error: ${
            response.data?.message || "Unknown error"
          }`,
        };
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get transaction payload",
      };
    }
  }

  private async submitTransaction(
    payloadData: any
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Build transaction using the payload from Kana Labs
      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: payloadData,
      });

      // Sign and submit transaction
      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: this.account,
        });

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
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Transaction submission failed",
      };
    }
  }
}

// Test BTC limit orders - 4 long orders with 10x leverage
async function testBtcLimitOrders(): Promise<void> {
  try {
    validateConfig();
    const placer = new BtcLimitOrderPlacer();

    console.log("BTC Long Orders - Starting...");
    console.log("Market ID: 15 | Leverage: 10x | Size: 0.0001 BTC each");
    console.log("=".repeat(80));

    const orders = [
      { price: 115300, id: 1 },
      { price: 115400, id: 2 },
      { price: 115500, id: 3 },
      { price: 115600, id: 4 },
    ];

    const results = [];

    for (const order of orders) {
      console.log(`Placing Order ${order.id} at $${order.price}...`);

      const result = await placer.placeLimitOrder({
        marketId: "15",
        tradeSide: true, // Long
        direction: false, // Open position
        size: 0.0001,
        price: order.price,
        leverage: 10,
        restriction: 0,
      });

      results.push({
        id: order.id,
        price: order.price,
        success: result.success,
        hash: result.transactionHash,
        error: result.error,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Display results table
    console.log("\n" + "=".repeat(80));
    console.log("ORDER RESULTS SUMMARY");
    console.log("=".repeat(80));
    console.log("Order | Price    | Status   | Transaction Hash");
    console.log("-".repeat(80));

    results.forEach((result) => {
      const status = result.success ? "SUCCESS" : "FAILED";
      const hash = result.success
        ? result.hash?.substring(0, 20) + "..."
        : result.error?.substring(0, 30) + "...";
      console.log(
        `  ${result.id}   | $${result.price} | ${status.padEnd(8)} | ${hash}`
      );
    });

    console.log("=".repeat(80));
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the BTC limit order tests
if (require.main === module) {
  testBtcLimitOrders();
}
