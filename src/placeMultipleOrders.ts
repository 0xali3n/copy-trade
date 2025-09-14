import {
  AptosConfig,
  Aptos,
  Network,
  Account,
  Ed25519PrivateKey,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import axios from "axios";
import { config, validateConfig, getTimestamp } from "./config";

interface MultipleOrderParams {
  marketId: string;
  orderTypes: boolean[]; // true = limit order, false = market order
  tradeSides: boolean[]; // true = long, false = short
  directions: boolean[]; // false = open position, true = close position
  sizes: number[];
  prices: number[];
  leverages: number[];
  restrictions?: number[]; // optional
  takeProfits?: number[]; // optional
  stopLosses?: number[]; // optional
}

interface MultipleOrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  orderData?: any;
}

class MultipleOrderPlacer {
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

  async placeMultipleOrders(
    params: MultipleOrderParams
  ): Promise<MultipleOrderResult> {
    try {
      console.log(
        `${getTimestamp()} - Placing ${params.sizes.length} orders at once...`
      );

      // Build request body
      const body: any = {
        marketId: parseInt(params.marketId),
        orderTypes: params.orderTypes,
        tradeSides: params.tradeSides,
        directions: params.directions,
        sizes: params.sizes,
        prices: params.prices,
        leverages: params.leverages,
      };

      // Add optional parameters if provided
      if (params.restrictions) {
        body.restrictions = params.restrictions;
      }
      if (params.takeProfits) {
        body.takeProfits = params.takeProfits;
      }
      if (params.stopLosses) {
        body.stopLosses = params.stopLosses;
      }

      // Get transaction payload from Kana Labs API
      const response = await axios.post(
        `${config.kanaRestUrl}/placeMultipleOrders`,
        body,
        {
          headers: {
            "x-api-key": config.kanaApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data?.success) {
        return {
          success: false,
          error: `API returned error: ${
            response.data?.message || "Unknown error"
          }`,
        };
      }

      const payloadData = response.data.data;

      // Build and submit transaction
      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: payloadData,
      });

      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: this.account,
        });

      // Wait for transaction confirmation
      const response2 = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (response2.success) {
        return {
          success: true,
          transactionHash: committedTxn.hash,
          orderData: payloadData,
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
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Test multiple BTC orders with 10x leverage
async function testMultipleBtcOrders(): Promise<void> {
  try {
    validateConfig();
    const placer = new MultipleOrderPlacer();

    console.log("BTC Multiple Orders - Starting...");
    console.log(
      "Market ID: 15 | Leverage: 10x | Size: 0.0001 BTC each | 5 Orders"
    );
    console.log("=".repeat(80));

    const result = await placer.placeMultipleOrders({
      marketId: "15",
      orderTypes: [true, true, true, true, true], // All limit orders
      tradeSides: [true, true, true, true, true], // All long positions
      directions: [false, false, false, false, false], // All open positions
      sizes: [0.0001, 0.0001, 0.0001, 0.0001, 0.0001], // 0.0001 BTC each
      prices: [115300, 115400, 115500, 115600, 115700], // 5 different prices
      leverages: [10, 10, 10, 10, 10], // 10x leverage for all
      restrictions: [0, 0, 0, 0, 0], // NO_RESTRICTION for all
      takeProfits: [115400, 115500, 115600, 115700, 115800], // Take profit levels
      stopLosses: [114500, 114600, 114700, 114800, 114900], // Stop loss levels
    });

    // Display result
    console.log("\n" + "=".repeat(80));
    console.log("MULTIPLE ORDERS RESULT");
    console.log("=".repeat(80));

    if (result.success) {
      console.log("Status: SUCCESS");
      console.log(`Transaction Hash: ${result.transactionHash}`);
      console.log("Orders Placed:");
      console.log(
        "  - Order 1: BTC Long at $115,300 (10x) | TP: $116,000 | SL: $114,500"
      );
      console.log(
        "  - Order 2: BTC Long at $115,400 (10x) | TP: $116,100 | SL: $114,600"
      );
      console.log(
        "  - Order 3: BTC Long at $115,500 (10x) | TP: $116,200 | SL: $114,700"
      );
      console.log(
        "  - Order 4: BTC Long at $115,600 (10x) | TP: $116,300 | SL: $114,800"
      );
      console.log(
        "  - Order 5: BTC Long at $115,700 (10x) | TP: $116,400 | SL: $114,900"
      );
    } else {
      console.log("Status: FAILED");
      console.log(`Error: ${result.error}`);
    }

    console.log("=".repeat(80));
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the multiple BTC orders test
if (require.main === module) {
  testMultipleBtcOrders();
}
