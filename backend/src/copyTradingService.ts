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
import { config, getTimestamp } from "./config";

interface OrderData {
  address: string;
  market_id: string;
  order_type: number;
  price: string;
  size: string;
  leverage: number;
  order_id: string;
  timestamp: string;
  status: string;
}

interface LimitOrderParams {
  marketId: string;
  tradeSide: boolean; // true = long, false = short
  direction: boolean; // false = open position, true = close position
  size: number;
  price: number;
  leverage: number;
  restriction?: number;
}

interface OrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class CopyTradingService {
  private aptos: Aptos;
  private account: Account | null = null;
  private trackedOrders: Set<string> = new Set();
  private botStartTime: number = 0;
  private isInitialized: boolean = false;

  // Copy trading settings
  private copyTradingEnabled: boolean = true;
  private copySizeMultiplier: number = 1.0;
  private maxCopySize: number = 0.001;
  private minCopySize: number = 0.0001;

  constructor() {
    // Initialize Aptos client but don't create account until needed
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);
  }

  async initialize(): Promise<void> {
    try {
      console.log(
        `${getTimestamp()} - 🎯 Initializing Copy Trading Service...`
      );

      // Initialize Aptos account if private key is configured
      if (config.aptosPrivateKeyHex) {
        const formattedPrivateKey = PrivateKey.formatPrivateKey(
          config.aptosPrivateKeyHex,
          "ed25519" as PrivateKeyVariants
        );
        this.account = Account.fromPrivateKey({
          privateKey: new Ed25519PrivateKey(formattedPrivateKey),
        });
        console.log(
          `${getTimestamp()} - ✅ Copy trading account initialized: ${
            this.account.accountAddress
          }`
        );
      } else {
        throw new Error("APTOS_PRIVATE_KEY_HEX not configured");
      }

      this.botStartTime = Math.floor(Date.now() / 1000);
      this.isInitialized = true;
      console.log(
        `${getTimestamp()} - ✅ Copy Trading Service initialized successfully!`
      );
      console.log(`${getTimestamp()} - 📊 Copy Trading Settings:`);
      console.log(`   - Enabled: ${this.copyTradingEnabled}`);
      console.log(`   - Size Multiplier: ${this.copySizeMultiplier}x`);
      console.log(`   - Min Copy Size: ${this.minCopySize}`);
      console.log(`   - Max Copy Size: ${this.maxCopySize}`);
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Failed to initialize copy trading service:`,
        error
      );
      throw error;
    }
  }

  async processOrder(order: OrderData): Promise<void> {
    if (!this.isInitialized) {
      console.log(
        `${getTimestamp()} - ⚠️ Copy trading service not initialized, skipping order`
      );
      return;
    }

    const orderTimestamp = parseInt(order.timestamp);
    const isNewOrder = !this.trackedOrders.has(order.order_id);
    const isAfterBotStart = orderTimestamp >= this.botStartTime;

    if (isNewOrder && isAfterBotStart) {
      this.trackedOrders.add(order.order_id);

      console.log("\n" + "=".repeat(80));
      console.log("🎯 NEW ORDER DETECTED - COPY TRADING");
      console.log("=".repeat(80));
      console.log(
        `📅 Time: ${new Date(orderTimestamp * 1000).toLocaleString()}`
      );
      console.log(`🆔 Order ID: ${order.order_id}`);
      console.log(
        `📊 Market: ${this.getMarketName(order.market_id)} (ID: ${
          order.market_id
        })`
      );
      console.log(
        `📈 Order Type: ${this.getOrderTypeDescription(order.order_type)}`
      );
      console.log(`💰 Price: $${parseFloat(order.price).toLocaleString()}`);
      console.log(`📏 Size: ${order.size}`);
      console.log(`⚡ Leverage: ${order.leverage}x`);
      console.log(`📊 Status: ${order.status}`);
      console.log(`📍 Address: ${order.address}`);

      const orderInfo = this.getOrderTypeInfo(order.order_type);

      if (orderInfo.isBuy) {
        console.log("🟢 ACTION: BUY ORDER PLACED");
        console.log(
          `   Target user placed BUY order: ${order.size} at $${order.price}`
        );
      } else if (orderInfo.isSell) {
        console.log("🔴 ACTION: SELL ORDER PLACED");
        console.log(
          `   Target user placed SELL order: ${order.size} at $${order.price}`
        );
      } else if (orderInfo.isExit) {
        console.log("🟡 ACTION: EXIT ORDER PLACED");
        console.log(
          `   Target user placed EXIT order: ${order.size} at $${order.price}`
        );
      }

      if (this.copyTradingEnabled) {
        await this.copyOrder(order, orderInfo);
      } else {
        console.log("⚠️ Copy trading is disabled - order not copied");
      }

      console.log("=".repeat(80) + "\n");
    }
  }

  private async copyOrder(
    order: OrderData,
    orderInfo: {
      isBuy: boolean;
      isSell: boolean;
      isExit: boolean;
      isLong: boolean;
      isShort: boolean;
    }
  ): Promise<void> {
    try {
      const originalSize = parseFloat(order.size);
      const copySize = Math.min(
        Math.max(originalSize * this.copySizeMultiplier, this.minCopySize),
        this.maxCopySize
      );

      console.log(`\n🔄 COPYING ORDER:`);
      console.log(`   Original Size: ${originalSize}`);
      console.log(
        `   Copy Size: ${copySize} (${this.copySizeMultiplier}x multiplier)`
      );
      console.log(`   Market: ${this.getMarketName(order.market_id)}`);
      console.log(`   Price: $${order.price}`);
      console.log(`   Leverage: ${order.leverage}x`);
      console.log(
        `   Order Type: ${this.getOrderTypeDescription(order.order_type)}`
      );

      let tradeSide: boolean;
      let direction: boolean;

      if (orderInfo.isExit) {
        tradeSide = orderInfo.isLong;
        direction = true; // Close position
      } else {
        tradeSide = orderInfo.isLong;
        direction = false; // Open position
      }

      const orderParams: LimitOrderParams = {
        marketId: order.market_id,
        tradeSide: tradeSide,
        direction: direction,
        size: copySize,
        price: parseFloat(order.price),
        leverage: order.leverage,
        restriction: 0,
      };

      const result = await this.placeLimitOrder(orderParams);

      if (result.success) {
        console.log(`✅ COPY ORDER SUCCESSFUL!`);
        console.log(`   Transaction Hash: ${result.transactionHash}`);
        console.log(
          `   Copied: ${copySize} ${this.getMarketName(order.market_id)} at $${
            order.price
          }`
        );
        console.log(
          `   Action: ${direction ? "CLOSED" : "OPENED"} ${
            tradeSide ? "LONG" : "SHORT"
          } position`
        );
      } else {
        console.log(`❌ COPY ORDER FAILED:`);
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.error(`${getTimestamp()} - ❌ Error copying order:`, error);
    }
  }

  private async placeLimitOrder(
    params: LimitOrderParams
  ): Promise<OrderResult> {
    try {
      const queryParams = new URLSearchParams({
        marketId: params.marketId,
        tradeSide: params.tradeSide.toString(),
        direction: params.direction.toString(),
        size: params.size.toString(),
        price: params.price.toString(),
        leverage: params.leverage.toString(),
      });

      if (params.restriction !== undefined) {
        queryParams.append("restriction", params.restriction.toString());
      }

      console.log(
        `${getTimestamp()} - 📡 Calling Kana API to place limit order...`
      );

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
      console.log(`${getTimestamp()} - 🔨 Building Aptos transaction...`);

      if (!this.account) {
        throw new Error("Account not initialized");
      }

      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: payloadData,
      });

      console.log(
        `${getTimestamp()} - ✍️ Signing and submitting transaction...`
      );

      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: this.account,
        });

      console.log(
        `${getTimestamp()} - ⏳ Waiting for transaction confirmation...`
      );

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

  private getOrderTypeDescription(orderType: number): string {
    const descriptions: { [key: number]: string } = {
      1: "Market Buy",
      2: "Limit Buy",
      3: "Stop Buy",
      4: "Market Sell",
      5: "Limit Sell",
      6: "Stop Sell",
      7: "Market Exit Long",
      8: "Limit Exit Long",
      9: "Stop Exit Long",
      10: "Market Exit Short",
      11: "Limit Exit Short",
      12: "Stop Exit Short",
    };
    return descriptions[orderType] || `Unknown (${orderType})`;
  }

  private getMarketName(marketId: string): string {
    const markets: { [key: string]: string } = {
      "14": "APT-USD",
      "15": "BTC-USD",
      "16": "ETH-USD",
      "31": "SOL-USD",
      "1338": "APT-USD (Testnet)",
      "1339": "BTC-USD (Testnet)",
      "1340": "ETH-USD (Testnet)",
      "2387": "SOL-USD (Testnet)",
    };
    return markets[marketId] || `Market ${marketId}`;
  }

  private getOrderTypeInfo(orderType: number): {
    isBuy: boolean;
    isSell: boolean;
    isExit: boolean;
    isLong: boolean;
    isShort: boolean;
  } {
    return {
      isBuy: orderType >= 1 && orderType <= 3,
      isSell: orderType >= 4 && orderType <= 6,
      isExit: orderType >= 7 && orderType <= 12,
      isLong:
        (orderType >= 1 && orderType <= 3) ||
        (orderType >= 7 && orderType <= 9),
      isShort:
        (orderType >= 4 && orderType <= 6) ||
        (orderType >= 10 && orderType <= 12),
    };
  }

  // Configuration methods
  setCopyTradingEnabled(enabled: boolean): void {
    this.copyTradingEnabled = enabled;
    console.log(
      `${getTimestamp()} - 🔧 Copy trading ${enabled ? "enabled" : "disabled"}`
    );
  }

  setCopySizeMultiplier(multiplier: number): void {
    this.copySizeMultiplier = multiplier;
    console.log(
      `${getTimestamp()} - 🔧 Copy size multiplier set to ${multiplier}x`
    );
  }

  setSizeLimits(min: number, max: number): void {
    this.minCopySize = min;
    this.maxCopySize = max;
    console.log(
      `${getTimestamp()} - 🔧 Copy size limits set: min=${min}, max=${max}`
    );
  }

  getStatus(): any {
    return {
      isInitialized: this.isInitialized,
      copyTradingEnabled: this.copyTradingEnabled,
      copySizeMultiplier: this.copySizeMultiplier,
      minCopySize: this.minCopySize,
      maxCopySize: this.maxCopySize,
      trackedOrdersCount: this.trackedOrders.size,
      accountAddress: this.account?.accountAddress || "not configured",
    };
  }
}

// Export singleton instance
export const copyTradingService = new CopyTradingService();
export { CopyTradingService };
