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

interface OrderHistoryUpdate {
  data: OrderData[];
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
}

interface OrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class CopyTradingBot {
  private aptos: Aptos;
  private account: Account;
  private ws: WebSocket | null = null;
  private targetProfileAddress: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;
  private pingInterval: NodeJS.Timeout | null = null;
  private trackedOrders: Set<string> = new Set();
  private botStartTime: number = 0;

  // Copy trading settings
  private copyTradingEnabled: boolean = true;
  private copySizeMultiplier: number = 1.0;
  private maxCopySize: number = 0.001;
  private minCopySize: number = 0.0001;

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
      console.log(`${getTimestamp()} - Initializing Copy Trading Bot...`);
      this.botStartTime = Math.floor(Date.now() / 1000);
      await this.getTargetProfileAddress();
      await this.connectWebSocket();
      console.log(
        `${getTimestamp()} - Copy Trading Bot initialized successfully!`
      );
    } catch (error) {
      console.error(`${getTimestamp()} - Failed to initialize bot:`, error);
      throw error;
    }
  }

  private async getTargetProfileAddress(): Promise<void> {
    try {
      console.log(
        `${getTimestamp()} - Getting profile address for target wallet: ${
          config.targetWalletAddress
        }`
      );

      const response = await axios.get(
        `${config.kanaRestUrl}/getProfileAddress`,
        {
          params: { userAddress: config.targetWalletAddress },
          headers: {
            "x-api-key": config.kanaApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        this.targetProfileAddress = response.data.data;
        console.log(
          `${getTimestamp()} - Target profile address: ${
            this.targetProfileAddress
          }`
        );
      } else {
        throw new Error(
          `Failed to get profile address: ${response.data?.message}`
        );
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - Error getting target profile address:`,
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

        this.ws!.on("open", () => {
          console.log(`${getTimestamp()} - WebSocket connected successfully!`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.subscribeToOrderHistory();
          this.startPingInterval();
          resolve();
        });

        this.ws!.on("message", (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws!.on("close", (code: number, reason: string) => {
          console.log(
            `${getTimestamp()} - WebSocket disconnected. Code: ${code}, Reason: ${reason}`
          );
          this.isConnected = false;
          this.stopPingInterval();
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.ws!.on("error", (error: Error) => {
          console.error(`${getTimestamp()} - WebSocket error:`, error);
          this.isConnected = false;
          reject(error);
        });

        this.ws!.on("pong", () => {
          console.log(`${getTimestamp()} - Received pong from server`);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private subscribeToOrderHistory(): void {
    if (!this.ws || !this.targetProfileAddress) {
      console.error(
        `${getTimestamp()} - Cannot subscribe: WebSocket or target profile address not available`
      );
      return;
    }

    const subscriptionMessage = {
      topic: "order_history",
      address: this.targetProfileAddress,
    };

    this.ws.send(JSON.stringify(subscriptionMessage));
    console.log(
      `${getTimestamp()} - ✅ Subscribed to order history for target user: ${
        this.targetProfileAddress
      }`
    );
  }

  private handleMessage(message: string): void {
    try {
      const data: any = JSON.parse(message);
      if (data.message === "order_history" && data.data) {
        this.processOrders(data.data);
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

  private processOrders(orders: OrderData[]): void {
    console.log(
      `${getTimestamp()} - 📊 Processing ${
        orders.length
      } orders from target user...`
    );

    for (const order of orders) {
      const orderTimestamp = parseInt(order.timestamp);
      const isNewOrder = !this.trackedOrders.has(order.order_id);
      const isAfterBotStart = orderTimestamp >= this.botStartTime;

      if (isNewOrder && isAfterBotStart) {
        this.trackedOrders.add(order.order_id);

        console.log("\n" + "=".repeat(80));
        console.log("🎯 NEW ORDER DETECTED FROM TARGET USER");
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
        console.log("=".repeat(80));

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
          this.copyOrder(order, orderInfo);
        }

        console.log("=".repeat(80) + "\n");
      }
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
      console.error(`${getTimestamp()} - Error copying order:`, error);
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
      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: payloadData,
      });

      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: this.account,
        });

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
    }, 20000);
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

      console.log("\n" + "=".repeat(80));
      console.log("🚀 COPY TRADING BOT STARTED");
      console.log("=".repeat(80));
      console.log(`📊 Monitoring orders from: ${this.targetProfileAddress}`);
      console.log(`🔗 WebSocket URL: ${config.kanaWsUrl}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log(
        `🎯 Copy Trading: ${this.copyTradingEnabled ? "ENABLED" : "DISABLED"}`
      );
      console.log(`📏 Size Multiplier: ${this.copySizeMultiplier}x`);
      console.log(`📊 Min Copy Size: ${this.minCopySize}`);
      console.log(`📊 Max Copy Size: ${this.maxCopySize}`);
      console.log("=".repeat(80));
      console.log(
        "📈 All orders from the target user will be automatically copied"
      );
      console.log("🔄 Bot will automatically reconnect if connection is lost");
      console.log("⏹️  Press Ctrl+C to stop the bot");
      console.log("=".repeat(80) + "\n");
    } catch (error) {
      console.error(`${getTimestamp()} - Failed to start bot:`, error);
      throw error;
    }
  }

  public stop(): void {
    console.log(`${getTimestamp()} - Stopping Copy Trading Bot...`);
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    console.log(`${getTimestamp()} - Bot stopped.`);
  }
}

async function startCopyTradingBot(): Promise<void> {
  try {
    validateConfig();

    console.log("=".repeat(80));
    console.log("🎯 KANA LABS COPY TRADING BOT");
    console.log("=".repeat(80));
    console.log("📊 Monitor and automatically copy orders from target user");
    console.log("🔗 Real-time WebSocket connection to Kana Labs");
    console.log("📈 Automatically executes same orders on your account");
    console.log("🎯 Target Wallet:", config.targetWalletAddress);
    console.log("=".repeat(80));

    const bot = new CopyTradingBot();

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
    console.log(`${getTimestamp()} - Bot is running. Press Ctrl+C to stop.`);
  } catch (error) {
    console.error("Failed to start Copy Trading Bot:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startCopyTradingBot();
}

export { CopyTradingBot };
