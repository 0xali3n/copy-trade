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
import { supabaseService, CopyTradingBot } from "./supabaseService";

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
  is_market_order?: boolean; // This field tells us if it's actually a market order
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
  private trackedOrders: Set<string> = new Set();
  private botStartTime: number = 0;
  private isInitialized: boolean = false;

  // Copy trading settings
  private copyTradingEnabled: boolean = true;

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

      // No need to initialize account here - will be done per-user with their private keys
      console.log(
        `${getTimestamp()} - ✅ Copy trading will use per-user private keys from database`
      );

      this.botStartTime = Math.floor(Date.now() / 1000);
      this.isInitialized = true;
      console.log(
        `${getTimestamp()} - ✅ Copy Trading Service initialized successfully!`
      );
      console.log(`${getTimestamp()} - 📊 Copy Trading Settings:`);
      console.log(`   - Enabled: ${this.copyTradingEnabled}`);
      console.log(
        `   - Copy Mode: EXACT COPY (same size, same order type, no limits)`
      );
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Failed to initialize copy trading service:`,
        error
      );
      throw error;
    }
  }

  async processOrderForUser(
    order: OrderData,
    userPrivateKey: string,
    bot: CopyTradingBot
  ): Promise<void> {
    try {
      console.log(
        `\n${getTimestamp()} - 🔄 Processing order for bot: ${
          bot.bot_name
        } (Target: ${bot.target_address})`
      );

      const orderTimestamp = parseInt(order.timestamp);
      const isNewOrder = !this.trackedOrders.has(order.order_id);
      const isAfterBotStart = orderTimestamp >= this.botStartTime;

      if (isNewOrder && isAfterBotStart) {
        this.trackedOrders.add(order.order_id);

        // Create user-specific account
        const userAccount = this.createAccountFromPrivateKey(userPrivateKey);
        if (!userAccount) {
          throw new Error("Failed to create account from private key");
        }

        console.log(
          `\n${getTimestamp()} - 🔄 Copying order for bot: ${bot.bot_name}`
        );
        console.log(`   User Wallet: ${userAccount.accountAddress}`);
        console.log(`   Target Address: ${bot.target_address}`);

        const orderInfo = this.getOrderTypeInfo(order.order_type);
        await this.copyOrderForUser(order, orderInfo, userAccount, bot);
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Error processing order for bot ${
          bot.bot_name
        }:`,
        error
      );

      // Update bot performance metrics (simplified for now)
      console.log(`❌ Error processing order for bot ${bot.bot_name}`);
    }
  }

  private createAccountFromPrivateKey(privateKeyHex: string): Account | null {
    try {
      const formattedPrivateKey = PrivateKey.formatPrivateKey(
        privateKeyHex,
        "ed25519" as PrivateKeyVariants
      );
      return Account.fromPrivateKey({
        privateKey: new Ed25519PrivateKey(formattedPrivateKey),
      });
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Error creating account from private key:`,
        error
      );
      return null;
    }
  }

  private async copyOrderForUser(
    order: OrderData,
    orderInfo: {
      isBuy: boolean;
      isSell: boolean;
      isExit: boolean;
      isLong: boolean;
      isShort: boolean;
    },
    userAccount: Account,
    bot: CopyTradingBot
  ): Promise<void> {
    try {
      const originalSize = parseFloat(order.size);
      const copySize = originalSize; // Copy EXACT same size as target

      console.log(`\n🔄 COPYING ORDER FOR USER:`);
      console.log(`   Original Size: ${originalSize}`);
      console.log(`   Copy Size: ${copySize} (EXACT COPY)`);
      console.log(`   Market: ${this.getMarketName(order.market_id)}`);
      console.log(`   Price: $${order.price}`);
      console.log(`   Leverage: ${order.leverage}x`);
      console.log(
        `   Order Type: ${this.getOrderTypeDescription(
          order.order_type
        )} (Type ID: ${order.order_type})`
      );
      console.log(`   Order Status: ${order.status}`);
      console.log(`   Full Order Data:`, JSON.stringify(order, null, 2));

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

      // Determine if this should be a market order or limit order based on the actual order data
      // Use the is_market_order field from the order data, not just the order type
      const isMarketOrder = (order as any).is_market_order === true;

      console.log(`   🔍 Order Type Analysis:`);
      console.log(`   - Order Type ID: ${order.order_type}`);
      console.log(`   - Is Market Order: ${isMarketOrder}`);
      console.log(
        `   - Will use: ${
          isMarketOrder ? "MARKET ORDER API" : "LIMIT ORDER API"
        }`
      );

      let result: any;
      if (isMarketOrder) {
        // For market orders, we need to use market order API
        console.log(
          `   📡 Using MARKET ORDER API for order type ${order.order_type}`
        );
        result = await this.placeMarketOrderForUser(orderParams, userAccount);
      } else {
        // For limit orders, use limit order API
        console.log(
          `   📡 Using LIMIT ORDER API for order type ${order.order_type}`
        );
        result = await this.placeLimitOrderForUser(orderParams, userAccount);
      }

      if (result.success) {
        console.log(`✅ COPY ORDER SUCCESSFUL FOR USER!`);
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

        // Update bot performance metrics (simplified for now)
        console.log(`✅ Trade successful for bot ${bot.bot_name}`);
      } else {
        console.log(`❌ COPY ORDER FAILED FOR USER:`);
        console.log(`   Error: ${result.error}`);

        // Update bot performance metrics (simplified for now)
        console.log(`❌ Trade failed for bot ${bot.bot_name}`);
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Error copying order for user:`,
        error
      );
      throw error;
    }
  }

  private async placeLimitOrderForUser(
    params: LimitOrderParams,
    userAccount: Account
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

      console.log(`${getTimestamp()} - 🔨 Building Kana Labs order request...`);
      console.log(
        `${getTimestamp()} - 📡 API URL: ${config.kanaRestUrl}/placeLimitOrder`
      );
      console.log(
        `${getTimestamp()} - 📊 Query params: ${queryParams.toString()}`
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

      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: userAccount.accountAddress,
        data: payloadData,
      });

      console.log(
        `${getTimestamp()} - ✍️ Signing and submitting transaction...`
      );

      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: userAccount,
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
      console.error(`${getTimestamp()} - ❌ API Error details:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred",
      };
    }
  }

  private async placeMarketOrderForUser(
    params: LimitOrderParams,
    userAccount: Account
  ): Promise<OrderResult> {
    try {
      const queryParams = new URLSearchParams({
        marketId: params.marketId,
        tradeSide: params.tradeSide.toString(),
        direction: params.direction.toString(),
        size: params.size.toString(),
        leverage: params.leverage.toString(),
      });

      console.log(
        `${getTimestamp()} - 🔨 Building Kana Labs MARKET order request...`
      );
      console.log(
        `${getTimestamp()} - 📡 API URL: ${config.kanaRestUrl}/placeMarketOrder`
      );
      console.log(
        `${getTimestamp()} - 📊 Query params: ${queryParams.toString()}`
      );

      const response = await axios.get(
        `${config.kanaRestUrl}/placeMarketOrder?${queryParams.toString()}`,
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
      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: userAccount.accountAddress,
        data: payloadData,
      });

      console.log(
        `${getTimestamp()} - ✍️ Signing and submitting transaction...`
      );
      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: userAccount,
        });

      console.log(
        `${getTimestamp()} - ⏳ Waiting for transaction confirmation...`
      );
      const response2 = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (response2.success) {
        console.log(
          `${getTimestamp()} - ✅ Market order transaction confirmed!`
        );
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
      console.error(`${getTimestamp()} - ❌ Market Order API Error details:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred",
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

  // Removed size multiplier and limits - using exact copy only

  getStatus(): any {
    return {
      isInitialized: this.isInitialized,
      copyTradingEnabled: this.copyTradingEnabled,
      copyMode: "EXACT COPY (same size, same order type, no limits)",
      trackedOrdersCount: this.trackedOrders.size,
      accountAddress: "per-user accounts from database",
    };
  }
}

// Export singleton instance
export const copyTradingService = new CopyTradingService();
export { CopyTradingService };
