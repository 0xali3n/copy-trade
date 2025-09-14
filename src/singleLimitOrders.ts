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

    console.log("MULTIPLE LIMIT ORDERS - Starting...");
    console.log("Market ID: 15 | Leverage: 10x | Size: 0.0001 BTC each");
    console.log("=".repeat(80));

    // Define multiple buy prices
    const buyPrices = [116000, 115900, 115800, 115700, 115600];
    const orderResults: Array<{
      buyPrice: number;
      sellPrice: number;
      buyResult: OrderResult | null;
      sellResult: OrderResult | null;
    }> = [];

    // Place multiple BUY orders at different prices
    for (let i = 0; i < buyPrices.length; i++) {
      const buyPrice = buyPrices[i];
      const sellPrice = buyPrice + 100;

      console.log(`\n📈 STEP ${i + 1}: Placing BUY order at $${buyPrice}...`);

      const buyResult = await placer.placeLimitOrder({
        marketId: "15",
        tradeSide: true, // Long side
        direction: false, // Open position
        size: 0.0001, // 0.0001 BTC
        price: buyPrice,
        leverage: 10, // 10x leverage
        restriction: 0, // NO_RESTRICTION
      });

      let sellResult: OrderResult | null = null;

      if (buyResult.success) {
        console.log(`✅ BUY order at $${buyPrice} placed successfully!`);
        console.log(`   Transaction Hash: ${buyResult.transactionHash}`);
        console.log(
          `   Price: $${buyPrice} | Size: 0.0001 BTC | Leverage: 10x`
        );

        // Wait a moment before placing sell order
        console.log(`⏳ Waiting 3 seconds before placing SELL order...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Place corresponding SELL order
        console.log(`📉 Placing SELL order at $${sellPrice}...`);
        sellResult = await placer.placeLimitOrder({
          marketId: "15",
          tradeSide: true, // Long side (same as buy)
          direction: true, // Close position
          size: 0.0001, // Same size as buy order
          price: sellPrice,
          leverage: 10, // Same leverage
          restriction: 0, // NO_RESTRICTION
        });

        if (sellResult.success) {
          console.log(`✅ SELL order at $${sellPrice} placed successfully!`);
          console.log(`   Transaction Hash: ${sellResult.transactionHash}`);
          console.log(
            `   Price: $${sellPrice} | Size: 0.0001 BTC | Leverage: 10x`
          );
          console.log(`   Profit Target: +$100`);
        } else {
          console.log(`❌ SELL order at $${sellPrice} failed:`);
          console.log(`   Error: ${sellResult.error}`);
        }

        orderResults.push({
          buyPrice,
          sellPrice,
          buyResult,
          sellResult,
        });

        // Wait between orders
        if (i < buyPrices.length - 1) {
          console.log(`⏳ Waiting 3 seconds before next order...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } else {
        console.log(`❌ BUY order at $${buyPrice} failed:`);
        console.log(`   Error: ${buyResult.error}`);
        orderResults.push({
          buyPrice,
          sellPrice,
          buyResult: null,
          sellResult: null,
        });
      }
    }

    // Display final results
    console.log("\n" + "=".repeat(80));
    console.log("MULTIPLE LIMIT ORDERS RESULT");
    console.log("=".repeat(80));

    let successCount = 0;
    for (let i = 0; i < orderResults.length; i++) {
      const { buyPrice, sellPrice, buyResult, sellResult } = orderResults[i];

      if (buyResult && buyResult.success) {
        successCount++;
        console.log(`Order ${i + 1}: ✅ SUCCESS`);
        console.log(`  - BUY: BTC Long at $${buyPrice} (10x) | Open Position`);
        console.log(
          `  - SELL: BTC Close Long at $${sellPrice} (10x) | Close Position (+$100)`
        );
        console.log(`  - BUY Transaction: ${buyResult.transactionHash}`);
        if (sellResult && sellResult.success) {
          console.log(`  - SELL Transaction: ${sellResult.transactionHash}`);
        }
        console.log(
          `  - Strategy: If price hits $${buyPrice} → BUY fills, then if price hits $${sellPrice} → SELL fills (+$100 profit)`
        );
      } else {
        console.log(`Order ${i + 1}: ❌ FAILED`);
        console.log(`  - BUY at $${buyPrice} failed`);
        if (buyResult) {
          console.log(`  - Error: ${buyResult.error}`);
        }
      }
      console.log("");
    }

    console.log("=".repeat(80));
    console.log(
      `SUMMARY: ${successCount}/${buyPrices.length} order pairs placed successfully`
    );
    console.log("=".repeat(80));
    console.log("🎯 STRATEGY COMPLETE:");
    console.log("  - Multiple buy orders at different price levels");
    console.log("  - Each buy order has a corresponding sell order at +$100");
    console.log("  - WebSocket bot will also monitor for any additional fills");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  testSingleLimitOrders();
}
