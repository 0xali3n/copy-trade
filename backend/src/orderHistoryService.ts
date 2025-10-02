import { config, getTimestamp } from "./config";
import { copyTradingService } from "./copyTradingService";
import WebSocket from "ws";

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

interface OrderHistoryService {
  isMonitoring: boolean;
  targetProfileAddress: string | null;
  trackedOrders: Set<string>;
  startMonitoring(targetWalletAddress: string): Promise<void>;
  stopMonitoring(): void;
  getStatus(): any;
}

class KanaOrderHistoryService implements OrderHistoryService {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;
  private pingInterval: NodeJS.Timeout | null = null;

  public isMonitoring: boolean = false;
  public targetProfileAddress: string | null = null;
  public trackedOrders: Set<string> = new Set();

  async startMonitoring(targetWalletAddress: string): Promise<void> {
    try {
      console.log(
        `${getTimestamp()} - 🎯 Starting order history monitoring for: ${targetWalletAddress}`
      );

      // Step 1: Initialize copy trading service (optional)
      try {
        await copyTradingService.initialize();
      } catch (error: any) {
        console.log(
          `${getTimestamp()} - ⚠️ Copy trading not available: ${error.message}`
        );
        console.log(
          `${getTimestamp()} - 📊 Order monitoring will continue without copy trading`
        );
      }

      // Step 2: Get profile address for the target wallet
      await this.getTargetProfileAddress(targetWalletAddress);

      // Step 3: Connect to WebSocket
      await this.connectWebSocket();

      // Step 4: Subscribe to order history
      this.subscribeToOrderHistory();

      this.isMonitoring = true;
      console.log(
        `${getTimestamp()} - ✅ Order history monitoring started successfully!`
      );
      console.log(
        `${getTimestamp()} - 🚀 Copy trading is ACTIVE - orders will be automatically copied!`
      );
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Failed to start order history monitoring:`,
        error
      );
      throw error;
    }
  }

  private async getTargetProfileAddress(
    targetWalletAddress: string
  ): Promise<void> {
    try {
      console.log(
        `${getTimestamp()} - 🔍 Getting profile address for wallet: ${targetWalletAddress}`
      );

      const response = await fetch(
        `${config.kanaRestUrl}/getProfileAddress?userAddress=${targetWalletAddress}`,
        {
          headers: {
            "x-api-key": config.kanaApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const data: any = await response.json();

      if (data?.success) {
        this.targetProfileAddress = data.data;
        console.log(
          `${getTimestamp()} - 🎯 Target profile address: ${
            this.targetProfileAddress
          }`
        );
      } else {
        throw new Error(`Failed to get profile address: ${data?.message}`);
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Error getting profile address:`,
        error
      );
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(
          `${getTimestamp()} - 🔌 Connecting to Kana Labs WebSocket...`
        );
        this.ws = new WebSocket(config.kanaWsUrl);

        this.ws.on("open", () => {
          console.log(
            `${getTimestamp()} - ✅ WebSocket connected successfully!`
          );
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on("close", (code: number, reason: string) => {
          console.log(
            `${getTimestamp()} - ❌ WebSocket disconnected. Code: ${code}, Reason: ${reason}`
          );
          this.stopPingInterval();
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.ws.on("error", (error: Error) => {
          console.error(`${getTimestamp()} - ❌ WebSocket error:`, error);
          reject(error);
        });

        this.ws.on("pong", () => {
          console.log(`${getTimestamp()} - 🏓 Received pong from server`);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private subscribeToOrderHistory(): void {
    if (!this.ws || !this.targetProfileAddress) {
      console.error(
        `${getTimestamp()} - ❌ Cannot subscribe: WebSocket or target profile address not available`
      );
      return;
    }

    const subscriptionMessage = {
      topic: "order_history",
      address: this.targetProfileAddress,
    };

    this.ws.send(JSON.stringify(subscriptionMessage));
    console.log(
      `${getTimestamp()} - ✅ Subscribed to order history for profile: ${
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
        `${getTimestamp()} - ❌ Error parsing WebSocket message:`,
        error
      );
    }
  }

  private processOrders(orders: OrderData[]): void {
    console.log(
      `${getTimestamp()} - 📊 Processing ${
        orders.length
      } orders from target user...`
    );

    for (const order of orders) {
      const isNewOrder = !this.trackedOrders.has(order.order_id);

      if (isNewOrder) {
        this.trackedOrders.add(order.order_id);
        this.displayOrder(order);

        // Process order for copy trading
        copyTradingService.processOrder(order).catch((error) => {
          console.error(
            `${getTimestamp()} - ❌ Error processing order for copy trading:`,
            error
          );
        });
      }
    }
  }

  private displayOrder(order: OrderData): void {
    const orderTimestamp = parseInt(order.timestamp);
    const orderTime = new Date(orderTimestamp * 1000).toLocaleString();

    console.log("\n" + "=".repeat(80));
    console.log("🎯 NEW ORDER DETECTED FROM TARGET USER");
    console.log("=".repeat(80));
    console.log(`📅 Time: ${orderTime}`);
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

    console.log("=".repeat(80) + "\n");
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

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        console.log(
          `${getTimestamp()} - 🏓 Sent ping to keep connection alive`
        );
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
      `${getTimestamp()} - 🔄 Scheduling reconnection attempt ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts} in ${delay / 1000} seconds...`
    );

    setTimeout(() => {
      this.connectWebSocket().catch((error) => {
        console.error(`${getTimestamp()} - ❌ Reconnection failed:`, error);
      });
    }, delay);
  }

  stopMonitoring(): void {
    console.log(`${getTimestamp()} - 🛑 Stopping order history monitoring...`);
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isMonitoring = false;
    this.targetProfileAddress = null;
    this.trackedOrders.clear();
    console.log(`${getTimestamp()} - ✅ Order history monitoring stopped.`);
  }

  getStatus(): any {
    return {
      isMonitoring: this.isMonitoring,
      targetProfileAddress: this.targetProfileAddress,
      trackedOrdersCount: this.trackedOrders.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const orderHistoryService = new KanaOrderHistoryService();
export { KanaOrderHistoryService };
