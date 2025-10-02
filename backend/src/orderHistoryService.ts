import { config, getTimestamp } from "./config";
import { copyTradingService } from "./copyTradingService";
import { supabaseService } from "./supabaseService";
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
  targetProfileAddresses: Map<string, string>; // targetAddress -> profileAddress
  trackedOrders: Set<string>;
  startMonitoringFromDatabase(): Promise<void>;
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
  private serviceStartTime: number = 0; // Track when service started to filter historical orders

  public isMonitoring: boolean = false;
  public targetProfileAddresses: Map<string, string> = new Map(); // targetAddress -> profileAddress
  public trackedOrders: Set<string> = new Set();

  async startMonitoringFromDatabase(): Promise<void> {
    try {
      // Set service start time to filter out historical orders
      // Add a small buffer to avoid processing orders created just before service start
      this.serviceStartTime = Math.floor(Date.now() / 1000) - 30; // 30 seconds buffer

      console.log(
        `${getTimestamp()} - 🎯 Starting order history monitoring from database...`
      );

      // Step 1: Test database connection
      const dbConnected = await supabaseService.testConnection();
      if (!dbConnected) {
        throw new Error("Database connection failed");
      }

      // Step 2: Get active target addresses from database
      const targetAddresses = await supabaseService.getActiveTargetAddresses();
      console.log(
        `${getTimestamp()} - 📊 Found ${
          targetAddresses.length
        } active target addresses:`,
        targetAddresses
      );

      if (targetAddresses.length === 0) {
        console.log(
          `${getTimestamp()} - ⚠️ No active copy trading bots found in database`
        );
        return;
      }

      // Step 3: Initialize copy trading service
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

      // Step 4: Get profile addresses for all target wallets
      for (const targetAddress of targetAddresses) {
        try {
          await this.getTargetProfileAddress(targetAddress);
        } catch (error) {
          console.error(
            `${getTimestamp()} - ❌ Failed to get profile address for ${targetAddress}:`,
            error
          );
        }
      }

      // Step 5: Connect to WebSocket
      await this.connectWebSocket();

      // Step 6: Subscribe to order history for all targets
      this.subscribeToOrderHistoryForAllTargets();

      this.isMonitoring = true;
      console.log(
        `${getTimestamp()} - ✅ Order history monitoring started successfully for ${
          targetAddresses.length
        } targets!`
      );
      console.log(
        `${getTimestamp()} - 🚀 Copy trading is ACTIVE - orders will be automatically copied!`
      );
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Failed to start order history monitoring from database:`,
        error
      );
      throw error;
    }
  }

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
        this.targetProfileAddresses.set(targetWalletAddress, data.data);
        console.log(
          `${getTimestamp()} - 🎯 Target profile address for ${targetWalletAddress}: ${
            data.data
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

  private subscribeToOrderHistoryForAllTargets(): void {
    if (!this.ws || this.targetProfileAddresses.size === 0) {
      console.error(
        `${getTimestamp()} - ❌ Cannot subscribe: WebSocket or target profile addresses not available`
      );
      return;
    }

    for (const [targetAddress, profileAddress] of this.targetProfileAddresses) {
      const subscriptionMessage = {
        topic: "order_history",
        address: profileAddress,
        // Only get new orders, not historical ones
        from_timestamp: Math.floor(Date.now() / 1000), // Current timestamp
      };

      this.ws.send(JSON.stringify(subscriptionMessage));
      console.log(
        `${getTimestamp()} - ✅ Subscribed to order history for target ${targetAddress} (profile: ${profileAddress})`
      );
    }
  }

  private subscribeToOrderHistory(): void {
    if (!this.ws || this.targetProfileAddresses.size === 0) {
      console.error(
        `${getTimestamp()} - ❌ Cannot subscribe: WebSocket or target profile addresses not available`
      );
      return;
    }

    // Subscribe to the first target (for backward compatibility)
    const firstProfileAddress = Array.from(
      this.targetProfileAddresses.values()
    )[0];
    const subscriptionMessage = {
      topic: "order_history",
      address: firstProfileAddress,
      // Only get new orders, not historical ones
      from_timestamp: Math.floor(Date.now() / 1000), // Current timestamp
    };

    this.ws.send(JSON.stringify(subscriptionMessage));
    console.log(
      `${getTimestamp()} - ✅ Subscribed to order history for profile: ${firstProfileAddress}`
    );
  }

  private handleMessage(message: string): void {
    try {
      const data: any = JSON.parse(message);
      if (data.message === "order_history" && data.data) {
        this.processOrders(data.data).catch((error) => {
          console.error(
            `${getTimestamp()} - ❌ Error processing orders:`,
            error
          );
        });
      }
    } catch (error) {
      console.error(
        `${getTimestamp()} - ❌ Error parsing WebSocket message:`,
        error
      );
    }
  }

  private async processOrders(orders: OrderData[]): Promise<void> {
    // Only process NEW orders, not historical ones
    const newOrders = orders.filter((order) => {
      // Filter out already tracked orders
      if (this.trackedOrders.has(order.order_id)) {
        return false;
      }

      // Filter out historical orders (orders before service started)
      const orderTimestamp = parseInt(order.timestamp);
      if (orderTimestamp < this.serviceStartTime) {
        return false;
      }

      return true;
    });

    if (newOrders.length === 0) {
      return; // No new orders to process
    }

    // Only log if we have a reasonable number of new orders (not historical bulk data)
    if (newOrders.length <= 5) {
      console.log(
        `${getTimestamp()} - 📊 Processing ${
          newOrders.length
        } NEW orders from target users...`
      );
    } else {
      console.log(
        `${getTimestamp()} - 📊 Received ${orders.length} orders, processing ${
          newOrders.length
        } NEW orders (filtering out ${
          orders.length - newOrders.length
        } already processed)...`
      );
    }

    for (const order of newOrders) {
      this.trackedOrders.add(order.order_id);
      this.displayOrder(order);

      // Find which target address this order belongs to
      const targetAddress = this.findTargetAddressByProfileAddress(
        order.address
      );
      if (targetAddress) {
        // Get all bots for this target address
        try {
          const bots = await supabaseService.getBotsForTargetAddress(
            targetAddress
          );
          if (bots.length > 0) {
            console.log(
              `${getTimestamp()} - 🤖 Found ${
                bots.length
              } active bots for target ${targetAddress}`
            );
          }

          // Process order for each bot
          for (const bot of bots) {
            console.log(
              `${getTimestamp()} - 🔄 Processing order for bot: ${
                bot.bot_name
              } (Target: ${bot.target_address})`
            );

            // Use the real private key from the bot
            if (bot.user_private_key) {
              copyTradingService
                .processOrderForUser(order, bot.user_private_key, bot)
                .catch((error) => {
                  console.error(
                    `${getTimestamp()} - ❌ Error processing order for bot ${
                      bot.bot_name
                    }:`,
                    error
                  );
                });
            } else {
              console.log(
                `${getTimestamp()} - ⚠️ No private key found for bot: ${
                  bot.bot_name
                }`
              );
            }
          }
        } catch (error) {
          console.error(
            `${getTimestamp()} - ❌ Error getting bots for target ${targetAddress}:`,
            error
          );
        }
      } else {
        console.log(
          `${getTimestamp()} - ⚠️ Could not find target address for profile: ${
            order.address
          }`
        );
      }
    }
  }

  private findTargetAddressByProfileAddress(
    profileAddress: string
  ): string | null {
    for (const [targetAddress, profAddress] of this.targetProfileAddresses) {
      if (profAddress === profileAddress) {
        return targetAddress;
      }
    }
    return null;
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
        // Remove ping logs to reduce noise - only log every 5th ping
        if (Math.random() < 0.2) {
          console.log(`${getTimestamp()} - 🏓 Connection alive (ping sent)`);
        }
      }
    }, 60000); // Increased to 60 seconds to reduce frequency
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
    this.targetProfileAddresses.clear();
    this.trackedOrders.clear();
    console.log(`${getTimestamp()} - ✅ Order history monitoring stopped.`);
  }

  getStatus(): any {
    return {
      isMonitoring: this.isMonitoring,
      targetProfileAddresses: Object.fromEntries(this.targetProfileAddresses),
      trackedOrdersCount: this.trackedOrders.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const orderHistoryService = new KanaOrderHistoryService();
export { KanaOrderHistoryService };
