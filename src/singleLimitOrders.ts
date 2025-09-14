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

interface LimitOrderParams {
  marketId: string;
  tradeSide: boolean; // true = long, false = short
  direction: boolean; // false = open position, true = close position
  size: number;
  price: number;
  leverage: number;
  restriction?: number;
  takeProfit?: number;
  stopLoss?: number;
}

interface OrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class SingleLimitOrderPlacer {
  private aptos: Aptos;
  private account: Account;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);

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
      console.log(`${getTimestamp()} - Placing limit order...`);
      console.log(`  Market ID: ${params.marketId}`);
      console.log(`  Trade Side: ${params.tradeSide ? "Long" : "Short"}`);
      console.log(`  Direction: ${params.direction ? "Close" : "Open"}`);
      console.log(`  Size: ${params.size} BTC`);
      console.log(`  Price: $${params.price}`);
      console.log(`  Leverage: ${params.leverage}x`);

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

      // Get transaction payload from Kana Labs API using GET request
      const response = await axios.get(
        `${config.kanaRestUrl}/placeLimitOrder?${queryParams.toString()}`,
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
        };
      } else {
        return {
          success: false,
          error: "Transaction failed to confirm",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  }
}

async function testSingleLimitOrders(): Promise<void> {
  try {
    validateConfig();
    const placer = new SingleLimitOrderPlacer();

    console.log("SINGLE LIMIT ORDERS - Starting...");
    console.log("Market ID: 15 | Leverage: 10x | Size: 0.0001 BTC");
    console.log("=".repeat(80));

    const buyPrice = 115600;

    // Place BUY order (open long position)
    console.log("\n📈 Placing BUY order...");
    const buyResult = await placer.placeLimitOrder({
      marketId: "15",
      tradeSide: true, // Long side
      direction: false, // Open position
      size: 0.00012, // 0.00012 BTC
      price: buyPrice, // $115,600
      leverage: 10, // 10x leverage
      restriction: 0, // NO_RESTRICTION
    });

    // Display result
    console.log("\n" + "=".repeat(80));
    console.log("SINGLE LIMIT ORDERS RESULT");
    console.log("=".repeat(80));

    if (buyResult.success) {
      console.log("BUY Order: ✅ SUCCESS");
      console.log(`  - BTC Long at $${buyPrice} (10x) | Open Position`);
      console.log(`  - Transaction: ${buyResult.transactionHash}`);
      console.log("\n🎯 Order Placed:");
      console.log(
        `  - If price hits $${buyPrice} → BUY order fills (opens long)`
      );
      console.log(
        "  - WebSocket bot will automatically place close order at +$100"
      );
    } else {
      console.log("BUY Order: ❌ FAILED");
      console.log(`  - Error: ${buyResult.error}`);
    }

    console.log("=".repeat(80));
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  testSingleLimitOrders();
}
