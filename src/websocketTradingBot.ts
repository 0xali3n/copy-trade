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

interface OrderHistoryData {
  address: string;
  is_market_order: boolean;
  last_updated: string;
  leverage: number;
  market_id: string;
  order_id: string;
  order_type: number;
  order_value: string;
  price: string;
  size: string;
  status: string;
  timestamp: string;
  trade_id: string;
}

interface OrderHistoryUpdate {
  data: OrderHistoryData[];
  message: string;
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

class WebSocketTradingBot {
  private aptos: Aptos;
  private account: Account;
  private ws: WebSocket | null = null;
  private profileAddress: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000; // 5 seconds
  private pingInterval: NodeJS.Timeout | null = null;
  private trackedOrders: Set<string> = new Set(); // Track order_ids to avoid duplicate processing
  private botStartTime: number = 0; // Track when bot started to filter old orders
  private originalOrderPrices: Map<string, number> = new Map(); // Store original order prices by order_id

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
      console.log(`${getTimestamp()} - Initializing WebSocket Trading Bot...`);

      // Record bot start time
      this.botStartTime = Math.floor(Date.now() / 1000);

      // Get profile address
      await this.getProfileAddress();

      // Connect to WebSocket
      await this.connectWebSocket();

      console.log(`${getTimestamp()} - Bot initialized successfully!`);
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

          // Subscribe to both open orders and order history
          this.subscribeToOpenOrders();
          this.subscribeToOrderHistory();

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

  private subscribeToOpenOrders(): void {
    if (!this.ws || !this.profileAddress) {
      console.error(
        `${getTimestamp()} - Cannot subscribe: WebSocket or profile address not available`
      );
      return;
    }

    const subscriptionMessage = {
      topic: "open_orders",
      address: this.profileAddress,
    };

    this.ws.send(JSON.stringify(subscriptionMessage));
    console.log(
      `${getTimestamp()} - Subscribed to open orders for address: ${
        this.profileAddress
      }`
    );
  }

  private subscribeToOrderHistory(): void {
    if (!this.ws || !this.profileAddress) {
      console.error(
        `${getTimestamp()} - Cannot subscribe: WebSocket or profile address not available`
      );
      return;
    }

    const subscriptionMessage = {
      topic: "order_history",
      address: this.profileAddress,
    };

    this.ws.send(JSON.stringify(subscriptionMessage));
    console.log(
      `${getTimestamp()} - Subscribed to order history for address: ${
        this.profileAddress
      }`
    );
  }

  private handleMessage(message: string): void {
    try {
      const data: any = JSON.parse(message);

      if (data.message === "order_history" && data.data) {
        this.processOrderHistory(data.data);
      } else if (data.message === "open_orders" && data.data) {
        this.processOpenOrders(data.data);
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - Error parsing WebSocket message:`,
        error
      );
    }
  }

  private processOpenOrders(orders: any[]): void {
    for (const order of orders) {
      // Store original order price when order is first placed
      const orderTimestamp = parseInt(order.timestamp);
      if (orderTimestamp >= this.botStartTime) {
        this.originalOrderPrices.set(order.order_id, parseFloat(order.price));
        console.log(
          `${getTimestamp()} - Stored original order price: Order ID ${
            order.order_id
          } at $${order.price}`
        );
      }
    }
  }

  private processOrderHistory(orders: OrderHistoryData[]): void {
    for (const order of orders) {
      // Check if this is a new order we haven't processed yet
      if (!this.trackedOrders.has(order.order_id)) {
        // Only show orders that happened after bot started
        const orderTimestamp = parseInt(order.timestamp);
        if (orderTimestamp >= this.botStartTime) {
          this.trackedOrders.add(order.order_id);

          // Display order information
          console.log(`${getTimestamp()} - Order Update:`);
          console.log(`  Order ID: ${order.order_id}`);
          console.log(`  Trade ID: ${order.trade_id}`);
          console.log(`  Market ID: ${order.market_id}`);
          console.log(`  Status: ${order.status}`);
          console.log(`  Order Price: $${order.price}`);
          console.log(`  Size: ${order.size}`);
          console.log(`  Leverage: ${order.leverage}x`);
          console.log(`  Order Type: ${order.order_type}`);
          console.log(`  Is Market Order: ${order.is_market_order}`);
          console.log(`  Timestamp: ${order.timestamp}`);
          console.log("---");

          // Check if this is a BUY order that got FILLED (order_type 1 or 2 typically for market/limit buy)
          // Place automatic close order for BUY fills using the ORIGINAL order price
          if (
            (order.order_type === 1 || order.order_type === 2) &&
            order.status === "Filled"
          ) {
            this.placeAutomaticCloseOrder(order);
          }
        }
      }
    }
  }

  private async placeAutomaticCloseOrder(
    order: OrderHistoryData
  ): Promise<void> {
    try {
      // Try to get the original order price from our stored data
      const storedOriginalPrice = this.originalOrderPrices.get(order.order_id);
      const originalOrderPrice = storedOriginalPrice || parseFloat(order.price);
      const size = parseFloat(order.size);
      const leverage = order.leverage;
      const closePrice = originalOrderPrice + 100; // +$100 profit from ORIGINAL order price

      console.log(`${getTimestamp()} - Placing automatic close order:`);
      console.log(
        `  Original Order Price: $${originalOrderPrice} ${
          storedOriginalPrice ? "(from stored data)" : "(from order history)"
        }`
      );
      console.log(`  Executed Price: $${order.price}`);
      console.log(`  Close Price: $${closePrice} (+$100 from original)`);
      console.log(`  Size: ${size}`);
      console.log(`  Leverage: ${leverage}x`);

      const closeOrderParams: LimitOrderParams = {
        marketId: order.market_id,
        tradeSide: true, // Long side (same as the filled order)
        direction: true, // Close position
        size: size,
        price: closePrice,
        leverage: leverage, // Use same leverage as original order
        restriction: 0, // NO_RESTRICTION
      };

      const result = await this.placeLimitOrder(closeOrderParams);

      if (result.success) {
        console.log(
          `${getTimestamp()} - ✅ Automatic close order placed successfully!`
        );
        console.log(`  Transaction Hash: ${result.transactionHash}`);
        console.log(
          `  Close Price: $${closePrice} (based on original order price $${originalOrderPrice})`
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
        `${getTimestamp()} - 🚀 WebSocket Trading Bot started successfully!`
      );
      console.log(
        `${getTimestamp()} - Monitoring order fills and will automatically place close orders at +$100...`
      );
    } catch (error) {
      console.error(`${getTimestamp()} - Failed to start bot:`, error);
      throw error;
    }
  }

  public stop(): void {
    console.log(`${getTimestamp()} - Stopping WebSocket Trading Bot...`);

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log(`${getTimestamp()} - Bot stopped.`);
  }
}

async function startWebSocketTradingBot(): Promise<void> {
  try {
    validateConfig();

    console.log("=".repeat(60));
    console.log("WEBSOCKET ORDER FILLS TRACKER");
    console.log("=".repeat(60));
    console.log(`${getTimestamp()} - Starting WebSocket Bot...`);
    console.log("Monitoring order fills in real-time...");
    console.log("=".repeat(60));

    const bot = new WebSocketTradingBot();

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
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Failed to start WebSocket Trading Bot:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startWebSocketTradingBot();
}

export { WebSocketTradingBot };
