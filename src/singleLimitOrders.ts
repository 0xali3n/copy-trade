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

// ===== GRID TRADING CONFIGURATION =====
interface UserGridInputs {
  marketId: number;
  upperBound: number; // Highest price for grid
  lowerBound: number; // Lowest price for grid
  gridCount: number; // Number of grid levels
  orderSize: number; // Size per order (in BTC)
  leverage: number; // Leverage for all orders
}

interface GridConfig extends UserGridInputs {
  gridSpacing: number; // Auto-calculated: (upperBound - lowerBound) / (gridCount - 1)
  profitTarget: number; // Auto-calculated: gridSpacing
}

// ===== USER CONFIGURATION =====
// 👤 MODIFY THESE VALUES TO CUSTOMIZE YOUR GRID TRADING BOT
// The system will automatically calculate gridSpacing and profitTarget
const DEFAULT_USER_INPUTS: UserGridInputs = {
  marketId: 15, // BTC-USD market (15=mainnet, 1339=testnet)
  upperBound: 115700, // Upper grid bound (highest price)
  lowerBound: 115300, // Lower grid bound (lowest price)
  gridCount: 5, // Number of grid levels
  orderSize: 0.0001, // Size per order (in BTC)
  leverage: 10, // Leverage for all orders
};

// Function to create complete GridConfig from user inputs
function createGridConfig(userInputs: UserGridInputs): GridConfig {
  const gridSpacing =
    (userInputs.upperBound - userInputs.lowerBound) /
    (userInputs.gridCount - 1);
  const profitTarget = gridSpacing; // Profit target equals grid spacing

  return {
    ...userInputs,
    gridSpacing,
    profitTarget,
  };
}

// Default Grid Configuration (auto-calculated)
const DEFAULT_GRID_CONFIG: GridConfig = createGridConfig(DEFAULT_USER_INPUTS);

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

// ===== GRID PRICE GENERATION =====
function generateGridPrices(config: GridConfig): {
  buyPrices: number[];
  sellPrices: number[];
} {
  const buyPrices: number[] = [];
  const sellPrices: number[] = [];

  // Generate grid prices from lower bound to upper bound
  for (let i = 0; i < config.gridCount; i++) {
    const buyPrice = config.lowerBound + i * config.gridSpacing;
    const sellPrice = buyPrice + config.profitTarget;

    // Only add if within bounds
    if (
      buyPrice <= config.upperBound &&
      sellPrice <= config.upperBound + config.profitTarget
    ) {
      buyPrices.push(buyPrice);
      sellPrices.push(sellPrice);
    }
  }

  return { buyPrices, sellPrices };
}

// ===== DISPLAY GRID CONFIGURATION =====
function displayGridConfiguration(config: GridConfig): void {
  console.log("=".repeat(80));
  console.log("🎯 GRID TRADING BOT CONFIGURATION");
  console.log("=".repeat(80));

  // User Inputs Section
  console.log("📝 USER INPUTS:");
  console.log(`📊 Market: BTC-USD (ID: ${config.marketId})`);
  console.log(
    `💰 Price Range: $${config.lowerBound.toLocaleString()} - $${config.upperBound.toLocaleString()}`
  );
  console.log(`📈 Grid Levels: ${config.gridCount} levels`);
  console.log(`💎 Order Size: ${config.orderSize} BTC per order`);
  console.log(`⚡ Leverage: ${config.leverage}x`);

  console.log("\n🧮 AUTO-CALCULATED VALUES:");
  console.log(
    `📏 Grid Spacing: $${config.gridSpacing.toLocaleString()} (calculated from price range)`
  );
  console.log(
    `🎯 Profit Target: +$${config.profitTarget} per grid (equals grid spacing)`
  );

  console.log("\n💰 FINANCIAL SUMMARY:");
  console.log(
    `💵 Total Investment: $${(
      config.gridCount *
      config.orderSize *
      config.lowerBound
    ).toLocaleString()}`
  );
  console.log(
    `📊 Max Profit Potential: $${(
      config.gridCount * config.profitTarget
    ).toLocaleString()}`
  );
  console.log("=".repeat(80));
}

async function testMultipleLimitOrders(): Promise<void> {
  try {
    validateConfig();
    const placer = new MultipleOrderPlacer();

    // Use grid configuration
    const gridConfig = DEFAULT_GRID_CONFIG;

    // Display grid configuration
    displayGridConfiguration(gridConfig);

    // Generate grid prices
    const { buyPrices, sellPrices } = generateGridPrices(gridConfig);

    console.log(`\n🎯 Generated ${buyPrices.length} grid levels:`);
    console.log(`📈 Buy Prices: $${buyPrices.join(", $")}`);
    console.log(`📉 Sell Prices: $${sellPrices.join(", $")}`);
    console.log("");

    console.log(
      `\n📈 STEP 1: Placing ${buyPrices.length} BUY orders at once...`
    );
    console.log(`  - BUY orders at: $${buyPrices.join(", $")}`);

    // Place BUY orders using grid configuration
    const buyResult = await placer.placeMultipleOrders({
      marketId: gridConfig.marketId,
      orderTypes: [...Array(buyPrices.length)].map(() => true), // All limit orders
      tradeSides: [...Array(buyPrices.length)].map(() => true), // All long
      directions: [...Array(buyPrices.length)].map(() => false), // All open positions
      sizes: [...Array(buyPrices.length)].map(() => gridConfig.orderSize), // Grid order size
      prices: buyPrices, // Generated buy prices
      leverages: [...Array(buyPrices.length)].map(() => gridConfig.leverage), // Grid leverage
    });

    const sellResults: OrderResult[] = [];

    if (buyResult.success) {
      console.log("✅ BUY orders placed successfully!");
      console.log(`   Transaction Hash: ${buyResult.transactionHash}`);

      // Wait 1 second before placing sell orders
      console.log("\n⏳ Waiting 1 second before placing SELL orders...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(
        `\n📉 STEP 2: Placing ${sellPrices.length} SELL orders one by one...`
      );

      // Place each SELL order individually
      for (let i = 0; i < sellPrices.length; i++) {
        console.log(
          `\n📉 Placing SELL order ${i + 1}/${sellPrices.length} at $${
            sellPrices[i]
          }...`
        );

        const sellResult = await placer.placeMultipleOrders({
          marketId: gridConfig.marketId,
          orderTypes: [true], // Single limit order
          tradeSides: [true], // Long
          directions: [true], // Close position
          sizes: [gridConfig.orderSize], // Grid order size
          prices: [sellPrices[i]], // Single sell price
          leverages: [gridConfig.leverage], // Grid leverage
        });

        sellResults.push(sellResult);

        if (sellResult.success) {
          console.log(`✅ SELL order ${i + 1} placed successfully!`);
          console.log(`   Transaction Hash: ${sellResult.transactionHash}`);
          console.log(
            `   Price: $${sellPrices[i]} | Size: ${gridConfig.orderSize} BTC | Leverage: ${gridConfig.leverage}x`
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
    console.log("🎯 GRID TRADING BOT RESULTS");
    console.log("=".repeat(80));

    if (buyResult.success) {
      console.log("📈 BUY Orders: ✅ SUCCESS");
      console.log(`  - Transaction Hash: ${buyResult.transactionHash}`);
      console.log(
        `  - ${buyPrices.length} BUY orders placed at: $${buyPrices.join(
          ", $"
        )}`
      );

      const successfulSells = sellResults.filter(
        (result) => result.success
      ).length;
      console.log(
        `\n📉 SELL Orders: ${
          successfulSells === buyPrices.length
            ? "✅ SUCCESS"
            : `⚠️ PARTIAL (${successfulSells}/${buyPrices.length})`
        }`
      );

      if (successfulSells > 0) {
        console.log(`  - ${successfulSells} SELL orders placed successfully`);
        console.log(`  - SELL orders at: $${sellPrices.join(", $")}`);
      }

      console.log("\n📊 GRID TRADING PAIRS:");
      for (let i = 0; i < buyPrices.length; i++) {
        const sellResult = sellResults[i];
        const profit = sellPrices[i] - buyPrices[i];
        console.log(`  Grid Level ${i + 1}:`);
        console.log(
          `    - BUY: BTC Long at $${buyPrices[i]} (${gridConfig.leverage}x) | Open Position ✅`
        );

        if (sellResult && sellResult.success) {
          console.log(
            `    - SELL: BTC Close Long at $${sellPrices[i]} (${gridConfig.leverage}x) | Close Position (+$${profit}) ✅`
          );
          console.log(`    - SELL Transaction: ${sellResult.transactionHash}`);
        } else {
          console.log(
            `    - SELL: BTC Close Long at $${sellPrices[i]} (${gridConfig.leverage}x) | Close Position (+$${profit}) ❌`
          );
          console.log(
            `    - SELL Error: ${sellResult?.error || "Not attempted"}`
          );
        }

        console.log(
          `    - Strategy: If price hits $${buyPrices[i]} → BUY fills, then if price hits $${sellPrices[i]} → SELL fills (+$${profit} profit)`
        );
        console.log("");
      }

      console.log("🎯 GRID TRADING STRATEGY COMPLETE:");
      console.log(
        `  - ${buyPrices.length} BUY orders placed in single transaction`
      );
      console.log(
        `  - ${buyPrices.length} SELL orders placed individually (one by one)`
      );
      console.log(
        `  - ${successfulSells}/${buyPrices.length} sell orders successful`
      );
      console.log(
        `  - Each grid level targets +$${gridConfig.profitTarget} profit`
      );
      console.log(
        `  - Total grid range: $${gridConfig.lowerBound} - $${gridConfig.upperBound}`
      );
      console.log(`  - Grid spacing: $${gridConfig.gridSpacing}`);
      console.log("  - WebSocket bot will monitor for any additional fills");
    } else {
      console.log("📈 BUY Orders: ❌ FAILED");
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
