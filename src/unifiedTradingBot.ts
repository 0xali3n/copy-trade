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
import WebSocket from "ws";
import { config, validateConfig, getTimestamp } from "./config";

interface TradeFillData {
  address: string;
  fee: string;
  last_updated: string;
  market_id: string;
  order_type: number;
  pnl: string;
  price: string;
  size: string;
  timestamp: string;
  trade_id: string;
}

interface PositionData {
  address: string;
  entry_price: string;
  is_long: boolean;
  last_updated: string;
  leverage: number;
  liq_price: string;
  margin: string;
  market_id: string;
  size: string;
  sl: string | null;
  tp: string | null;
  trade_id: string;
  value: string;
}

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

class UnifiedTradingBot {
  private aptos: Aptos;
  private account: Account;
  private ws: WebSocket | null = null;
  private profileAddress: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000; // 5 seconds
  private pingInterval: NodeJS.Timeout | null = null;

  // Trade fill tracking
  private trackedFills: Set<string> = new Set();
  private botStartTime: number = 0;

  // Position tracking
  private previousPositions: Map<string, PositionData> = new Map();

  // Subscription tracking
  private subscribedToTradeHistory: boolean = false;
  private subscribedToPositions: boolean = false;

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

  async initialize(): Promise<void> {
    try {
      console.log(`${getTimestamp()} - Initializing Unified Trading Bot...`);

      // Record bot start time
      this.botStartTime = Math.floor(Date.now() / 1000);

      // Get profile address
      await this.getProfileAddress();

      // Connect to WebSocket
      await this.connectWebSocket();

      console.log(
        `${getTimestamp()} - Unified Trading Bot initialized successfully!`
      );
    } catch (error) {
      console.error(`${getTimestamp()} - Failed to initialize bot:`, error);
      throw error;
    }
  }

  private async getProfileAddress(): Promise<void> {
    try {
      console.log(`${getTimestamp()} - Getting profile address...`);

      const response = await axios.get(
        `${config.kanaRestUrl}/getProfileAddress`,
        {
          params: {
            userAddress: config.aptosAddress,
          },
          headers: {
            "x-api-key": config.kanaApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        this.profileAddress = response.data.data;
        console.log(
          `${getTimestamp()} - Profile address: ${this.profileAddress}`
        );
      } else {
        throw new Error(
          `Failed to get profile address: ${response.data?.message}`
        );
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - Error getting profile address:`,
        error
      );
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`${getTimestamp()} - Connecting to WebSocket...`);

        this.ws = new WebSocket(config.kanaWsUrl);

        this.ws.on("open", () => {
          console.log(`${getTimestamp()} - WebSocket connected successfully!`);
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Subscribe to both trade history and positions
          this.subscribeToTradeHistory();
          this.subscribeToPositions();

          // Start ping interval
          this.startPingInterval();

          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on("close", (code: number, reason: string) => {
          console.log(
            `${getTimestamp()} - WebSocket disconnected. Code: ${code}, Reason: ${reason}`
          );
          this.isConnected = false;
          this.stopPingInterval();
          this.subscribedToTradeHistory = false;
          this.subscribedToPositions = false;

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            console.error(
              `${getTimestamp()} - Max reconnection attempts reached. Bot stopped.`
            );
          }
        });

        this.ws.on("error", (error: Error) => {
          console.error(`${getTimestamp()} - WebSocket error:`, error);
          this.isConnected = false;
          reject(error);
        });

        this.ws.on("pong", () => {
          console.log(`${getTimestamp()} - Received pong from server`);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private subscribeToTradeHistory(): void {
    if (!this.ws || !this.profileAddress || this.subscribedToTradeHistory) {
      return;
    }

    const subscriptionMessage = {
      topic: "trade_history",
      address: this.profileAddress,
    };

    this.ws.send(JSON.stringify(subscriptionMessage));
    this.subscribedToTradeHistory = true;
    console.log(
      `${getTimestamp()} - ✅ Subscribed to trade history (order fills) for address: ${
        this.profileAddress
      }`
    );
  }

  private subscribeToPositions(): void {
    if (!this.ws || !this.profileAddress || this.subscribedToPositions) {
      return;
    }

    const subscriptionMessage = {
      topic: "positions",
      address: this.profileAddress,
    };

    this.ws.send(JSON.stringify(subscriptionMessage));
    this.subscribedToPositions = true;
    console.log(
      `${getTimestamp()} - ✅ Subscribed to position updates for address: ${
        this.profileAddress
      }`
    );
  }

  private handleMessage(message: string): void {
    try {
      const data: any = JSON.parse(message);

      if (data.message === "trade_history" && data.data) {
        this.processTradeFills(data.data);
      } else if (data.message === "positions" && data.data) {
        this.processPositionUpdates(data.data);
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - Error parsing WebSocket message:`,
        error
      );
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

  // ===== TRADE FILL PROCESSING (BUY ORDER BOT LOGIC) =====
  private processTradeFills(fills: TradeFillData[]): void {
    console.log(
      `${getTimestamp()} - 📊 Processing ${fills.length} trade fills...`
    );

    for (const fill of fills) {
      const fillTimestamp = parseInt(fill.timestamp);
      const isNewFill = !this.trackedFills.has(fill.trade_id);
      const isAfterBotStart = fillTimestamp >= this.botStartTime;

      // Check if this is a new fill we haven't processed yet
      if (isNewFill && isAfterBotStart) {
        this.trackedFills.add(fill.trade_id);

        // Display fill information
        console.log(`${getTimestamp()} - 🎯 Order Fill Detected:`);
        console.log(`  Trade ID: ${fill.trade_id}`);
        console.log(`  Market ID: ${fill.market_id}`);
        console.log(
          `  Order Type: ${fill.order_type} (${this.getOrderTypeDescription(
            fill.order_type
          )})`
        );
        console.log(`  Fill Price: $${fill.price}`);
        console.log(`  Size: ${fill.size}`);
        console.log(`  Fee: ${fill.fee}`);
        console.log(`  PnL: ${fill.pnl}`);
        console.log("---");

        // Check if this is a BUY order fill (order_type 1, 2, or 3 for buy orders)
        if (
          fill.order_type === 1 ||
          fill.order_type === 2 ||
          fill.order_type === 3
        ) {
          console.log(
            `${getTimestamp()} - 🟢 BUY order fill detected (order_type: ${
              fill.order_type
            }), placing close order...`
          );
          this.placeAutomaticCloseOrder(fill);
        } else {
          console.log(
            `${getTimestamp()} - 🔴 Non-BUY order fill detected (order_type: ${
              fill.order_type
            }), skipping... (Position tracking handles EXIT fills)`
          );
        }
      }
    }
  }

  private async placeAutomaticCloseOrder(fill: TradeFillData): Promise<void> {
    try {
      const fillPrice = parseFloat(fill.price);
      const size = parseFloat(fill.size);
      const closePrice = fillPrice + 100; // +$100 profit from fill price

      console.log(`${getTimestamp()} - 📈 Placing automatic close order:`);
      console.log(`  Fill Price: $${fillPrice}`);
      console.log(`  Close Price: $${closePrice} (+$100 from fill price)`);
      console.log(`  Size: ${size}`);

      const closeOrderParams: LimitOrderParams = {
        marketId: fill.market_id,
        tradeSide: true, // Long side (same as the filled order)
        direction: true, // Close position
        size: size,
        price: closePrice,
        leverage: 10, // Default leverage
        restriction: 0, // NO_RESTRICTION
      };

      const result = await this.placeLimitOrder(closeOrderParams);

      if (result.success) {
        console.log(
          `${getTimestamp()} - ✅ Automatic close order placed successfully!`
        );
        console.log(`  Transaction Hash: ${result.transactionHash}`);
        console.log(
          `  Close Price: $${closePrice} (based on fill price $${fillPrice})`
        );
      } else {
        console.log(
          `${getTimestamp()} - ❌ Failed to place automatic close order:`
        );
        console.log(`  Error: ${result.error}`);
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - Error placing automatic close order:`,
        error
      );
    }
  }

  // ===== POSITION PROCESSING (EXIT ORDER BOT LOGIC) =====
  private processPositionUpdates(currentPositions: PositionData[]): void {
    console.log(
      `${getTimestamp()} - 📍 Processing ${
        currentPositions.length
      } current positions...`
    );

    // Create a map of current positions for easy lookup
    const currentPositionMap = new Map<string, PositionData>();
    currentPositions.forEach((position) => {
      currentPositionMap.set(position.trade_id, position);
    });

    // Check for closed positions (positions that were in previous but not in current)
    for (const [tradeId, previousPosition] of this.previousPositions) {
      if (!currentPositionMap.has(tradeId)) {
        // Position was closed!
        console.log(`${getTimestamp()} - 🚨 POSITION CLOSED DETECTED!`);
        console.log(`  Trade ID: ${tradeId}`);
        console.log(`  Market ID: ${previousPosition.market_id}`);
        console.log(
          `  Position Type: ${previousPosition.is_long ? "Long" : "Short"}`
        );
        console.log(`  Entry Price: $${previousPosition.entry_price}`);
        console.log(`  Size: ${previousPosition.size}`);
        console.log(`  Leverage: ${previousPosition.leverage}x`);
        console.log("---");

        // Place new buy order at entry price - $100
        this.placeAutomaticBuyOrder(previousPosition);
      }
    }

    // Update previous positions with current positions
    this.previousPositions.clear();
    currentPositions.forEach((position) => {
      this.previousPositions.set(position.trade_id, position);
    });

    // Log current positions
    if (currentPositions.length > 0) {
      console.log(`${getTimestamp()} - 📊 Current Active Positions:`);
      currentPositions.forEach((position) => {
        console.log(
          `  - Trade ID: ${position.trade_id} | ${
            position.is_long ? "Long" : "Short"
          } | Entry: $${position.entry_price} | Size: ${
            position.size
          } | Leverage: ${position.leverage}x`
        );
      });
    } else {
      console.log(`${getTimestamp()} - 📊 No active positions`);
    }
  }

  private async placeAutomaticBuyOrder(
    closedPosition: PositionData
  ): Promise<void> {
    try {
      const entryPrice = parseFloat(closedPosition.entry_price);
      const size = parseFloat(closedPosition.size);
      const newBuyPrice = entryPrice - 100; // $100 below entry price

      console.log(
        `${getTimestamp()} - 📉 Placing automatic buy order after position closure:`
      );
      console.log(`  Closed Position Entry Price: $${entryPrice}`);
      console.log(`  New Buy Price: $${newBuyPrice} (-$100 from entry price)`);
      console.log(`  Size: ${size}`);
      console.log(`  Market ID: ${closedPosition.market_id}`);

      const buyOrderParams: LimitOrderParams = {
        marketId: closedPosition.market_id,
        tradeSide: true, // Long side
        direction: false, // Open position
        size: size,
        price: newBuyPrice,
        leverage: closedPosition.leverage, // Use same leverage as closed position
        restriction: 0, // NO_RESTRICTION
      };

      const result = await this.placeLimitOrder(buyOrderParams);

      if (result.success) {
        console.log(
          `${getTimestamp()} - ✅ Automatic buy order placed successfully!`
        );
        console.log(`  Transaction Hash: ${result.transactionHash}`);
        console.log(
          `  New Buy Price: $${newBuyPrice} (based on closed position entry $${entryPrice})`
        );
        console.log(
          `  Strategy: When this buy fills, bot will place close order at $${
            newBuyPrice + 100
          }`
        );
      } else {
        console.log(
          `${getTimestamp()} - ❌ Failed to place automatic buy order:`
        );
        console.log(`  Error: ${result.error}`);
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - Error placing automatic buy order:`,
        error
      );
    }
  }

  // ===== SHARED ORDER PLACEMENT LOGIC =====
  private async placeLimitOrder(
    params: LimitOrderParams
  ): Promise<OrderResult> {
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

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.ping();
        console.log(`${getTimestamp()} - Sent ping to keep connection alive`);
      }
    }, 20000); // Send ping every 20 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(
      `${getTimestamp()} - Scheduling reconnection attempt ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts} in ${delay / 1000} seconds...`
    );

    setTimeout(() => {
      this.connectWebSocket().catch((error) => {
        console.error(`${getTimestamp()} - Reconnection failed:`, error);
      });
    }, delay);
  }

  public async start(): Promise<void> {
    try {
      await this.initialize();
      console.log(
        `${getTimestamp()} - 🚀 Unified Trading Bot started successfully!`
      );
      console.log(
        `${getTimestamp()} - 🔄 Monitoring both order fills AND position changes...`
      );
      console.log(`${getTimestamp()} - 📈 BUY fills → Close orders at +$100`);
      console.log(
        `${getTimestamp()} - 📉 Position closures → New buy orders at -$100`
      );
    } catch (error) {
      console.error(`${getTimestamp()} - Failed to start bot:`, error);
      throw error;
    }
  }

  public stop(): void {
    console.log(`${getTimestamp()} - Stopping Unified Trading Bot...`);

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log(`${getTimestamp()} - Bot stopped.`);
  }
}

async function startUnifiedTradingBot(): Promise<void> {
  try {
    validateConfig();

    console.log("=".repeat(70));
    console.log("🚀 UNIFIED TRADING BOT");
    console.log("=".repeat(70));
    console.log(`${getTimestamp()} - Starting Unified Trading Bot...`);
    console.log("🔄 Combines both BUY order tracking AND position monitoring");
    console.log("📈 BUY fills → Automatic close orders at +$100");
    console.log("📉 Position closures → Automatic buy orders at -$100");
    console.log("🎯 Single WebSocket connection for maximum efficiency");
    console.log("=".repeat(70));

    const bot = new UnifiedTradingBot();

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log(
        `\n${getTimestamp()} - Received SIGINT, shutting down gracefully...`
      );
      bot.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log(
        `\n${getTimestamp()} - Received SIGTERM, shutting down gracefully...`
      );
      bot.stop();
      process.exit(0);
    });

    await bot.start();

    // Keep the process running
    console.log(`${getTimestamp()} - Bot is running. Press Ctrl+C to stop.`);
    console.log("=".repeat(70));
  } catch (error) {
    console.error("Failed to start Unified Trading Bot:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startUnifiedTradingBot();
}

export { UnifiedTradingBot };
