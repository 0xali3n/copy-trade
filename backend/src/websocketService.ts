import WebSocket from "ws";
import { config, getTimestamp } from "./config";

class KanaWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;
  private pingInterval: NodeJS.Timeout | null = null;

  public isConnected: boolean = false;

  async connect(): Promise<void> {
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
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          // Just log that we received a message - no processing needed
          console.log(`${getTimestamp()} - 📨 Received message from Kana Labs`);
        });

        this.ws.on("close", (code: number, reason: string) => {
          console.log(
            `${getTimestamp()} - ❌ WebSocket disconnected. Code: ${code}, Reason: ${reason}`
          );
          this.isConnected = false;
          this.stopPingInterval();
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.ws.on("error", (error: Error) => {
          console.error(`${getTimestamp()} - ❌ WebSocket error:`, error);
          this.isConnected = false;
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

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
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
      this.connect().catch((error) => {
        console.error(`${getTimestamp()} - ❌ Reconnection failed:`, error);
      });
    }, delay);
  }

  disconnect(): void {
    console.log(`${getTimestamp()} - 🔌 Disconnecting WebSocket...`);
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    console.log(`${getTimestamp()} - ✅ WebSocket disconnected.`);
  }

  getStatus(): any {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const websocketService = new KanaWebSocketService();
export { KanaWebSocketService };
