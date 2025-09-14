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
  marketId: number;
  orderTypes: boolean[];
  tradeSides: boolean[];
  directions: boolean[];
  sizes: number[];
  prices: number[];
  leverages: number[];
}

interface OrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class MultipleOrderPlacer {
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

  async placeMultipleOrders(params: MultipleOrderParams): Promise<OrderResult> {
    try {
      console.log(`${getTimestamp()} - Placing multiple orders...`);
      console.log(`  Market ID: ${params.marketId}`);
      console.log(`  Number of Orders: ${params.orderTypes.length}`);
      console.log(
        `  Order Types: ${params.orderTypes
          .map((ot) => (ot ? "Limit" : "Market"))
          .join(", ")}`
      );
      console.log(
        `  Trade Sides: ${params.tradeSides
          .map((ts) => (ts ? "Long" : "Short"))
          .join(", ")}`
      );
      console.log(
        `  Directions: ${params.directions
          .map((d) => (d ? "Close" : "Open"))
          .join(", ")}`
      );
      console.log(`  Sizes: ${params.sizes.join(", ")} BTC`);
      console.log(`  Prices: $${params.prices.join(", $")}`);
      console.log(`  Leverages: ${params.leverages.join("x, ")}x`);

      // Prepare request body
      const body = {
        marketId: params.marketId,
        orderTypes: params.orderTypes,
        tradeSides: params.tradeSides,
        directions: params.directions,
        sizes: params.sizes,
        prices: params.prices,
        leverages: params.leverages,
      };

      // Get transaction payload from Kana Labs API using POST request
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

async function testMultipleLimitOrders(): Promise<void> {
  try {
    validateConfig();
    const placer = new MultipleOrderPlacer();

    console.log("MULTIPLE LIMIT ORDERS - Starting...");
    console.log("Market ID: 15 | Leverage: 10x | Size: 0.0001 BTC each");
    console.log("=".repeat(80));

    // Define multiple buy prices
    const buyPrices = [116000, 115900, 115800, 115700, 115600];
    const sellPrices = buyPrices.map((price) => price + 100);

    console.log("\n📈 STEP 1: Placing 5 BUY orders at once...");
    console.log(`  - BUY orders at: $${buyPrices.join(", $")}`);

    // Place 5 BUY orders first
    const buyResult = await placer.placeMultipleOrders({
      marketId: 15,
      orderTypes: [...Array(5)].map(() => true), // All limit orders
      tradeSides: [...Array(5)].map(() => true), // All long
      directions: [...Array(5)].map(() => false), // All open positions
      sizes: [...Array(5)].map(() => 0.0001), // All 0.0001 BTC
      prices: buyPrices, // Buy prices only
      leverages: [...Array(5)].map(() => 10), // All 10x leverage
    });

    const sellResults: OrderResult[] = [];

    if (buyResult.success) {
      console.log("✅ BUY orders placed successfully!");
      console.log(`   Transaction Hash: ${buyResult.transactionHash}`);

      // Wait 1 second before placing sell orders
      console.log("\n⏳ Waiting 1 second before placing SELL orders...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("\n📉 STEP 2: Placing SELL orders one by one...");

      // Place each SELL order individually
      for (let i = 0; i < sellPrices.length; i++) {
        console.log(
          `\n📉 Placing SELL order ${i + 1}/5 at $${sellPrices[i]}...`
        );

        const sellResult = await placer.placeMultipleOrders({
          marketId: 15,
          orderTypes: [true], // Single limit order
          tradeSides: [true], // Long
          directions: [true], // Close position
          sizes: [0.0001], // 0.0001 BTC
          prices: [sellPrices[i]], // Single sell price
          leverages: [10], // 10x leverage
        });

        sellResults.push(sellResult);

        if (sellResult.success) {
          console.log(`✅ SELL order ${i + 1} placed successfully!`);
          console.log(`   Transaction Hash: ${sellResult.transactionHash}`);
          console.log(
            `   Price: $${sellPrices[i]} | Size: 0.0001 BTC | Leverage: 10x`
          );
        } else {
          console.log(`❌ SELL order ${i + 1} failed:`);
          console.log(`   Error: ${sellResult.error}`);
        }

        // Small delay between individual sell orders
        if (i < sellPrices.length - 1) {
          console.log(`⏳ Waiting 1 second before next SELL order...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } else {
      console.log("❌ BUY orders failed:");
      console.log(`   Error: ${buyResult.error}`);
    }

    // Display final results
    console.log("\n" + "=".repeat(80));
    console.log("MULTIPLE LIMIT ORDERS RESULT");
    console.log("=".repeat(80));

    if (buyResult.success) {
      console.log("BUY Orders: ✅ SUCCESS");
      console.log(`  - Transaction Hash: ${buyResult.transactionHash}`);
      console.log(`  - 5 BUY orders placed at: $${buyPrices.join(", $")}`);

      const successfulSells = sellResults.filter(
        (result) => result.success
      ).length;
      console.log(
        `\nSELL Orders: ${
          successfulSells === 5
            ? "✅ SUCCESS"
            : `⚠️ PARTIAL (${successfulSells}/5)`
        }`
      );

      if (successfulSells > 0) {
        console.log(`  - ${successfulSells} SELL orders placed successfully`);
        console.log(`  - SELL orders at: $${sellPrices.join(", $")}`);
      }

      console.log("\n📊 ORDER PAIRS:");
      for (let i = 0; i < buyPrices.length; i++) {
        const sellResult = sellResults[i];
        console.log(`  Order Pair ${i + 1}:`);
        console.log(
          `    - BUY: BTC Long at $${buyPrices[i]} (10x) | Open Position ✅`
        );

        if (sellResult && sellResult.success) {
          console.log(
            `    - SELL: BTC Close Long at $${sellPrices[i]} (10x) | Close Position (+$100) ✅`
          );
          console.log(`    - SELL Transaction: ${sellResult.transactionHash}`);
        } else {
          console.log(
            `    - SELL: BTC Close Long at $${sellPrices[i]} (10x) | Close Position (+$100) ❌`
          );
          console.log(
            `    - SELL Error: ${sellResult?.error || "Not attempted"}`
          );
        }

        console.log(
          `    - Strategy: If price hits $${buyPrices[i]} → BUY fills, then if price hits $${sellPrices[i]} → SELL fills (+$100 profit)`
        );
        console.log("");
      }

      console.log("🎯 STRATEGY COMPLETE:");
      console.log("  - 5 BUY orders placed in single transaction");
      console.log("  - 5 SELL orders placed individually (one by one)");
      console.log(`  - ${successfulSells}/5 sell orders successful`);
      console.log("  - Each buy order has a corresponding sell order at +$100");
      console.log("  - WebSocket bot will monitor for any additional fills");
    } else {
      console.log("BUY Orders: ❌ FAILED");
      console.log(`  - Error: ${buyResult.error}`);
    }

    console.log("=".repeat(80));
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  testMultipleLimitOrders();
}
