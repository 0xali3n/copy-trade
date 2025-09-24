import WebSocket from "ws";
import { config, getTimestamp } from "../config";
import { getProfile } from "../getProfile";
import { placeLimitOrder, LimitOrderParams } from "../kanaClient";

interface CopyTradingConfig {
  targetWalletAddress: string;
  copySizeMultiplier: number;
  maxCopySize: number;
  minCopySize: number;
  copyTradingEnabled: boolean;
}

interface OrderData {
  order_id: string;
  market_id: number;
  order_type: number;
  price: string;
  size: string;
  leverage: number;
  status: string;
  address: string;
  timestamp: string;
}

interface TradingActivity {
  orderId: string;
  timestamp: number;
  marketId: number;
  orderType: number;
  price: number;
  size: number;
  leverage: number;
  status: string;
  action: string;
  copyResult?: {
    success: boolean;
    transactionHash?: string;
    error?: string;
  };
}

export class CopyTradingBot {
  private ws: WebSocket | null = null;
  private targetProfileAddress: string | null = null;
  private isRunningFlag: boolean = false;
  private startTime: number = 0;
  private trackedOrders: Set<string> = new Set();
  private recentActivity: TradingActivity[] = [];
  private config: CopyTradingConfig;

  constructor(config: CopyTradingConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    try {
      console.log(`${getTimestamp()} - 🚀 Starting Copy Trading Bot...`);

      // Get target profile address
      this.targetProfileAddress = await this.getTargetProfileAddress();
      if (!this.targetProfileAddress) {
        throw new Error("Failed to get target profile address");
      }

      // Connect to WebSocket
      await this.connectWebSocket();

      // Subscribe to order history
      this.subscribeToOrderHistory();

      this.isRunningFlag = true;
      this.startTime = Date.now();

      console.log(
        `${getTimestamp()} - ✅ Copy Trading Bot started successfully`
      );
      console.log(`   Target Address: ${this.targetProfileAddress}`);
      console.log(`   Copy Multiplier: ${this.config.copySizeMultiplier}x`);
      console.log(`   Max Copy Size: ${this.config.maxCopySize}`);
      console.log(`   Min Copy Size: ${this.config.minCopySize}`);
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Failed to start Copy Trading Bot:`,
        error
      );
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log(`${getTimestamp()} - 🛑 Stopping Copy Trading Bot...`);

      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.isRunningFlag = false;
      this.trackedOrders.clear();

      console.log(
        `${getTimestamp()} - ✅ Copy Trading Bot stopped successfully`
      );
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Error stopping Copy Trading Bot:`,
        error
      );
      throw error;
    }
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  getUptime(): number {
    return this.isRunningFlag ? Date.now() - this.startTime : 0;
  }

  getTargetWalletAddress(): string {
    return this.config.targetWalletAddress;
  }

  getCopySizeMultiplier(): number {
    return this.config.copySizeMultiplier;
  }

  getMaxCopySize(): number {
    return this.config.maxCopySize;
  }

  getMinCopySize(): number {
    return this.config.minCopySize;
  }

  setCopySizeMultiplier(multiplier: number): void {
    this.config.copySizeMultiplier = multiplier;
  }

  setMaxCopySize(size: number): void {
    this.config.maxCopySize = size;
  }

  setMinCopySize(size: number): void {
    this.config.minCopySize = size;
  }

  getRecentActivity(): TradingActivity[] {
    return this.recentActivity.slice(-50); // Return last 50 activities
  }

  private async getTargetProfileAddress(): Promise<string | null> {
    try {
      // This would typically make an API call to get the profile address
      // For now, we'll use the wallet address directly
      return this.config.targetWalletAddress;
    } catch (error) {
      console.error(
        `${getTimestamp()} - Error getting target profile address:`,
        error
      );
      return null;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(config.kanaWebSocketUrl);

      this.ws.on("open", () => {
        console.log(`${getTimestamp()} - ✅ Connected to Kana Labs WebSocket`);
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error(
            `${getTimestamp()} - Error parsing WebSocket message:`,
            error
          );
        }
      });

      this.ws.on("close", () => {
        console.log(`${getTimestamp()} - 🔌 WebSocket connection closed`);
        if (this.isRunningFlag) {
          console.log(`${getTimestamp()} - 🔄 Attempting to reconnect...`);
          setTimeout(() => this.connectWebSocket(), 5000);
        }
      });

      this.ws.on("error", (error) => {
        console.error(`${getTimestamp()} - WebSocket error:`, error);
        reject(error);
      });
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

  private handleWebSocketMessage(message: any): void {
    if (message.topic === "order_history" && message.data) {
      this.processOrders(message.data);
    }
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
      const isAfterBotStart = orderTimestamp >= this.startTime / 1000;

      if (isNewOrder && isAfterBotStart) {
        this.trackedOrders.add(order.order_id);

        const orderInfo = this.getOrderTypeInfo(order.order_type);
        const activity: TradingActivity = {
          orderId: order.order_id,
          timestamp: orderTimestamp * 1000,
          marketId: order.market_id,
          orderType: order.order_type,
          price: parseFloat(order.price),
          size: parseFloat(order.size),
          leverage: order.leverage,
          status: order.status,
          action: this.getOrderTypeDescription(order.order_type),
        };

        console.log(`\n${"=".repeat(80)}`);
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
        console.log("=".repeat(80));

        if (this.config.copyTradingEnabled) {
          this.copyOrder(order, orderInfo).then((result) => {
            activity.copyResult = result;
            this.recentActivity.push(activity);
          });
        } else {
          this.recentActivity.push(activity);
        }

        console.log("=".repeat(80) + "\n");
      }
    }
  }

  private async copyOrder(
    order: OrderData,
    orderInfo: any
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const originalSize = parseFloat(order.size);
      const copySize = Math.min(
        Math.max(
          originalSize * this.config.copySizeMultiplier,
          this.config.minCopySize
        ),
        this.config.maxCopySize
      );

      console.log(`\n🔄 COPYING ORDER:`);
      console.log(`   Original Size: ${originalSize}`);
      console.log(
        `   Copy Size: ${copySize} (${this.config.copySizeMultiplier}x multiplier)`
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
        direction = true;
      } else {
        tradeSide = orderInfo.isLong;
        direction = false;
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

      const result = await placeLimitOrder(orderParams);

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

        return {
          success: true,
          transactionHash: result.transactionHash,
        };
      } else {
        console.log(`❌ COPY ORDER FAILED:`);
        console.log(`   Error: ${result.error}`);

        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error(`${getTimestamp()} - Error copying order:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getOrderTypeInfo(orderType: number): any {
    const isBuy = [1, 2, 3].includes(orderType);
    const isSell = [4, 5, 6].includes(orderType);
    const isExit = [7, 8, 9, 10, 11, 12].includes(orderType);
    const isLong = [1, 2, 3, 7, 8, 9].includes(orderType);
    const isShort = [4, 5, 6, 10, 11, 12].includes(orderType);
    const isMarket = [1, 4, 7, 10].includes(orderType);
    const isLimit = [2, 5, 8, 11].includes(orderType);
    const isStop = [3, 6, 9, 12].includes(orderType);

    return {
      isBuy,
      isSell,
      isExit,
      isLong,
      isShort,
      isMarket,
      isLimit,
      isStop,
    };
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
    return descriptions[orderType] || `Unknown Order Type ${orderType}`;
  }

  private getMarketName(marketId: number): string {
    const markets: { [key: number]: string } = {
      15: "BTC-USD",
      16: "ETH-USD",
      17: "SOL-USD",
      18: "APT-USD",
      19: "SUI-USD",
    };
    return markets[marketId] || `Market ${marketId}`;
  }
}
