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
  private isInitialized: boolean = false;

  // Per-bot tracking - each bot has its own tracked orders and start time
  private botTrackedOrders: Map<string, Set<string>> = new Map(); // botId -> Set<orderId>
  private botStartTimes: Map<string, number> = new Map(); // botId -> startTime
  private activeBots: Set<string> = new Set(); // Set of active bot IDs

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

      this.isInitialized = true;
      console.log(
        `${getTimestamp()} - ✅ Copy Trading Service initialized successfully!`
      );
      console.log(`${getTimestamp()} - 📊 Copy Trading Settings:`);
      console.log(`   - Enabled: ${this.copyTradingEnabled}`);
      console.log(
        `   - Copy Mode: EXACT COPY (same size, same order type, no limits)`
      );
      console.log(`   - Multi-Bot Support: ENABLED (per-bot tracking)`);
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

      // Check if bot is active
      if (!this.isBotActive(bot.id)) {
        console.log(
          `${getTimestamp()} - ⚠️ Bot ${
            bot.bot_name
          } is not active, skipping order`
        );
        return;
      }

      // Initialize bot tracking if not exists
      this.initializeBotTracking(bot.id);

      const orderTimestamp = parseInt(order.timestamp);
      const botTrackedOrders = this.botTrackedOrders.get(bot.id)!;
      const botStartTime = this.botStartTimes.get(bot.id)!;

      const isNewOrder = !botTrackedOrders.has(order.order_id);
      const isAfterBotStart = orderTimestamp >= botStartTime;

      if (isNewOrder && isAfterBotStart) {
        botTrackedOrders.add(order.order_id);

        // Create user-specific account
        const userAccount = this.createAccountFromPrivateKey(userPrivateKey);
        if (!userAccount) {
          throw new Error("Failed to create account from private key");
        }

        console.log(
          `\n${getTimestamp()} - 🔄 Copying order for bot: ${bot.bot_name}`
        );
        console.log(`   Bot ID: ${bot.id}`);
        console.log(`   User Wallet: ${userAccount.accountAddress}`);
        console.log(`   Target Address: ${bot.target_address}`);

        const orderInfo = this.getOrderTypeInfo(order.order_type);
        await this.copyOrderForUser(order, orderInfo, userAccount, bot);
      } else if (!isNewOrder) {
        console.log(
          `${getTimestamp()} - ⏭️ Order ${
            order.order_id
          } already processed by bot ${bot.bot_name}`
        );
      } else if (!isAfterBotStart) {
        console.log(
          `${getTimestamp()} - ⏭️ Order ${order.order_id} is before bot ${
            bot.bot_name
          } start time`
        );
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
      console.log(`   🔍 Order Analysis:`);
      console.log(`   - Order Type: ${order.order_type}`);
      console.log(`   - isBuy: ${orderInfo.isBuy}`);
      console.log(`   - isSell: ${orderInfo.isSell}`);
      console.log(`   - isExit: ${orderInfo.isExit}`);
      console.log(`   - isLong: ${orderInfo.isLong}`);
      console.log(`   - isShort: ${orderInfo.isShort}`);
      console.log(
        `   - Order Description: ${this.getOrderTypeDescription(
          order.order_type
        )}`
      );
      console.log(`   - Raw Order Data:`, {
        order_type: order.order_type,
        price: order.price,
        size: order.size,
        leverage: order.leverage,
        market_id: order.market_id,
      });

      let tradeSide: boolean;
      let direction: boolean;

      if (orderInfo.isExit) {
        // For exit orders, use the original position type
        tradeSide = orderInfo.isLong;
        direction = true; // Close position
        console.log(
          `   🎯 EXIT ORDER: tradeSide=${tradeSide} (${
            tradeSide ? "LONG" : "SHORT"
          }), direction=CLOSE`
        );
      } else {
        // For new orders, determine side based on buy/sell
        // Buy orders (1-3) = Long (true), Sell orders (4-6) = Short (false)
        tradeSide = orderInfo.isBuy; // isBuy = true for long, false for short
        direction = false; // Open position
        console.log(
          `   🎯 NEW ORDER: tradeSide=${tradeSide} (${
            tradeSide ? "LONG" : "SHORT"
          }), direction=OPEN`
        );
        console.log(
          `   📊 Order Type Mapping: Type ${order.order_type} → ${
            orderInfo.isBuy ? "BUY (LONG)" : "SELL (SHORT)"
          }`
        );
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

        // Store the successful trade in database
        const tradeAction = this.getTradeAction(orderInfo, direction);
        console.log(
          `   💾 Storing trade in database with action: ${tradeAction}`
        );

        await this.storeTradeInDatabase({
          user_wallet_address: userAccount.accountAddress.toString(),
          bot_id: bot.id,
          symbol: this.getMarketName(order.market_id),
          market_id: order.market_id,
          action: tradeAction,
          order_type: isMarketOrder ? "MARKET" : "LIMIT",
          leverage: order.leverage,
          price: parseFloat(order.price),
          quantity: copySize,
          transaction_hash: result.transactionHash,
          order_id: order.order_id,
          target_address: bot.target_address,
          status: "SUCCESS",
        });

        console.log(`✅ Trade successful for bot ${bot.bot_name}`);
      } else {
        console.log(`❌ COPY ORDER FAILED FOR USER:`);
        console.log(`   Error: ${result.error}`);

        // Store the failed trade in database
        const tradeAction = this.getTradeAction(orderInfo, direction);
        console.log(
          `   💾 Storing FAILED trade in database with action: ${tradeAction}`
        );

        await this.storeTradeInDatabase({
          user_wallet_address: userAccount.accountAddress.toString(),
          bot_id: bot.id,
          symbol: this.getMarketName(order.market_id),
          market_id: order.market_id,
          action: tradeAction,
          order_type: isMarketOrder ? "MARKET" : "LIMIT",
          leverage: order.leverage,
          price: parseFloat(order.price),
          quantity: copySize,
          order_id: order.order_id,
          target_address: bot.target_address,
          status: "FAILED",
        });

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
        options: {
          maxGasAmount: 10000, // Set lower gas limit
          gasUnitPrice: 100, // Set lower gas price
        },
      });

      console.log(
        `${getTimestamp()} - ✍️ Signing and submitting transaction...`
      );
      console.log(
        `${getTimestamp()} - 💰 Gas settings: maxGasAmount=10000, gasUnitPrice=100 (Total: ~0.001 APT)`
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
      console.error(`${getTimestamp()} - ❌ Limit Order API Error details:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });

      // Check for specific gas fee error
      if (
        error.message &&
        error.message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")
      ) {
        console.log(
          `${getTimestamp()} - 💡 Gas Fee Error: User wallet needs more APT for transaction fees`
        );
        console.log(
          `${getTimestamp()} - 💡 Current gas cost: ~0.001 APT (maxGasAmount=10000, gasUnitPrice=100)`
        );
        console.log(
          `${getTimestamp()} - 💡 Recommended: Ensure wallet has at least 0.01 APT for multiple trades`
        );
      }

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
        options: {
          maxGasAmount: 10000, // Set lower gas limit
          gasUnitPrice: 100, // Set lower gas price
        },
      });

      console.log(
        `${getTimestamp()} - ✍️ Signing and submitting transaction...`
      );
      console.log(
        `${getTimestamp()} - 💰 Gas settings: maxGasAmount=10000, gasUnitPrice=100 (Total: ~0.001 APT)`
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

      // Check for specific gas fee error
      if (
        error.message &&
        error.message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")
      ) {
        console.log(
          `${getTimestamp()} - 💡 Gas Fee Error: User wallet needs more APT for transaction fees`
        );
        console.log(
          `${getTimestamp()} - 💡 Current gas cost: ~0.001 APT (maxGasAmount=10000, gasUnitPrice=100)`
        );
        console.log(
          `${getTimestamp()} - 💡 Recommended: Ensure wallet has at least 0.01 APT for multiple trades`
        );
      }

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
      // Add more order types that might exist
      13: "Market Short",
      14: "Limit Short",
      15: "Stop Short",
      16: "Market Long",
      17: "Limit Long",
      18: "Stop Long",
    };
    return descriptions[orderType] || `Unknown Order Type (${orderType})`;
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
      // Original order types (1-12) + Extended order types (13-18)
      isBuy:
        (orderType >= 1 && orderType <= 3) ||
        (orderType >= 16 && orderType <= 18),
      isSell:
        (orderType >= 4 && orderType <= 6) ||
        (orderType >= 13 && orderType <= 15),
      isExit: orderType >= 7 && orderType <= 12,
      isLong:
        (orderType >= 1 && orderType <= 3) ||
        (orderType >= 7 && orderType <= 9) ||
        (orderType >= 16 && orderType <= 18),
      isShort:
        (orderType >= 4 && orderType <= 6) ||
        (orderType >= 10 && orderType <= 12) ||
        (orderType >= 13 && orderType <= 15),
    };
  }

  // Configuration methods
  setCopyTradingEnabled(enabled: boolean): void {
    this.copyTradingEnabled = enabled;
    console.log(
      `${getTimestamp()} - 🔧 Copy trading ${enabled ? "enabled" : "disabled"}`
    );
  }

  // Bot management methods
  private initializeBotTracking(botId: string): void {
    if (!this.botTrackedOrders.has(botId)) {
      this.botTrackedOrders.set(botId, new Set());
      // Set start time to 1 hour ago to allow processing recent orders
      this.botStartTimes.set(botId, Math.floor(Date.now() / 1000) - 3600);
      this.activeBots.add(botId);
      console.log(
        `${getTimestamp()} - 🤖 Initialized tracking for bot ${botId} (start time: 1 hour ago)`
      );
    }
  }

  private isBotActive(botId: string): boolean {
    return this.activeBots.has(botId);
  }

  public activateBot(botId: string): void {
    this.initializeBotTracking(botId);
    console.log(`${getTimestamp()} - ✅ Bot ${botId} activated`);
  }

  public deactivateBot(botId: string): void {
    this.activeBots.delete(botId);
    console.log(`${getTimestamp()} - ⏸️ Bot ${botId} deactivated`);
  }

  public getBotStatus(botId: string): {
    isActive: boolean;
    trackedOrdersCount: number;
    startTime: number | null;
  } {
    return {
      isActive: this.isBotActive(botId),
      trackedOrdersCount: this.botTrackedOrders.get(botId)?.size || 0,
      startTime: this.botStartTimes.get(botId) || null,
    };
  }

  public getAllBotsStatus(): Map<string, any> {
    const status = new Map();
    for (const botId of this.activeBots) {
      status.set(botId, this.getBotStatus(botId));
    }
    return status;
  }

  // Removed size multiplier and limits - using exact copy only

  /**
   * Store trade in database
   */
  private async storeTradeInDatabase(tradeData: {
    user_wallet_address: string;
    bot_id: string;
    symbol: string;
    market_id: string;
    action: "BUY" | "SELL" | "EXIT_LONG" | "EXIT_SHORT";
    order_type: "MARKET" | "LIMIT" | "STOP";
    leverage: number;
    price: number;
    quantity: number;
    transaction_hash?: string;
    order_id?: string;
    target_address?: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
  }): Promise<void> {
    try {
      console.log(
        `${getTimestamp()} - 💾 STORING COPY TRADE ONLY (not target trade):`,
        {
          user_wallet: tradeData.user_wallet_address,
          bot_id: tradeData.bot_id,
          action: tradeData.action,
          order_id: tradeData.order_id,
          status: tradeData.status,
        }
      );

      const storedTrade = await supabaseService.storeTrade(tradeData);
      if (storedTrade) {
        console.log(
          `${getTimestamp()} - ✅ COPY TRADE stored in database: ${
            storedTrade.id
          }`
        );
      } else {
        console.log(
          `${getTimestamp()} - ⚠️ Failed to store COPY TRADE in database`
        );
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Error storing COPY TRADE in database:`,
        error
      );
    }
  }

  /**
   * Get trade action based on order info and direction
   */
  private getTradeAction(
    orderInfo: {
      isBuy: boolean;
      isSell: boolean;
      isExit: boolean;
      isLong: boolean;
      isShort: boolean;
    },
    direction: boolean
  ): "BUY" | "SELL" | "EXIT_LONG" | "EXIT_SHORT" {
    if (direction) {
      // Closing position - use the original position type
      return orderInfo.isLong ? "EXIT_LONG" : "EXIT_SHORT";
    } else {
      // Opening position - use buy/sell to determine action
      return orderInfo.isBuy ? "BUY" : "SELL";
    }
  }

  getStatus(): any {
    const allBotsStatus = this.getAllBotsStatus();
    const totalTrackedOrders = Array.from(
      this.botTrackedOrders.values()
    ).reduce((sum, orders) => sum + orders.size, 0);

    return {
      isInitialized: this.isInitialized,
      copyTradingEnabled: this.copyTradingEnabled,
      copyMode: "EXACT COPY (same size, same order type, no limits)",
      multiBotSupport: true,
      activeBotsCount: this.activeBots.size,
      totalTrackedOrdersCount: totalTrackedOrders,
      botsStatus: Object.fromEntries(allBotsStatus),
      accountAddress: "per-user accounts from database",
    };
  }
}

// Export singleton instance
export const copyTradingService = new CopyTradingService();
export { CopyTradingService };
