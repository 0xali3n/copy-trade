# 📚 Social Trade - API Documentation

## Overview

The Social Trade API provides endpoints for managing copy trading bots, monitoring trades, and handling user interactions. The API is built with Node.js, Express.js, and TypeScript, providing type-safe and efficient operations.

## Base URL

```
Production: https://api.socialtrade.com
Development: http://localhost:3001
```

## Authentication

The API uses Supabase authentication with JWT tokens. Include the authorization header in your requests:

```http
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Health & Status

#### GET /health

Check the health status of the API server.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### GET /status

Get detailed status information about all services.

**Response:**

```json
{
  "server": {
    "status": "running",
    "uptime": 3600,
    "memory": {
      "used": "45MB",
      "total": "128MB"
    }
  },
  "database": {
    "status": "connected",
    "responseTime": "12ms"
  },
  "websocket": {
    "status": "connected",
    "activeConnections": 5
  },
  "copyTrading": {
    "enabled": true,
    "activeBots": 3,
    "totalTrades": 150
  }
}
```

### Bot Management

#### POST /api/refresh-bots

Trigger a refresh of active bots from the database. This endpoint is called by the frontend when bots are created, updated, or deleted.

**Request Body:**

```json
{}
```

**Response:**

```json
{
  "success": true,
  "message": "Bots refreshed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "activeBots": 3
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Database connection failed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## WebSocket API

### Connection

Connect to the WebSocket endpoint:

```javascript
const ws = new WebSocket("wss://api.socialtrade.com/ws");
```

### Message Format

All WebSocket messages follow this format:

```json
{
  "type": "message_type",
  "data": {
    // Message-specific data
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Message Types

#### Bot Status Update

Sent when a bot's status changes:

```json
{
  "type": "bot_status_update",
  "data": {
    "botId": "uuid",
    "status": "active|paused|stopped",
    "message": "Bot activated successfully"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Trade Execution

Sent when a trade is executed:

```json
{
  "type": "trade_execution",
  "data": {
    "botId": "uuid",
    "tradeId": "uuid",
    "status": "success|failed",
    "transactionHash": "0x...",
    "symbol": "BTC-USD",
    "action": "BUY|SELL|EXIT_LONG|EXIT_SHORT",
    "quantity": 0.001,
    "price": 45000.0
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Error Notification

Sent when an error occurs:

```json
{
  "type": "error",
  "data": {
    "code": "TRADE_FAILED",
    "message": "Insufficient balance for transaction",
    "botId": "uuid"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Data Models

### CopyTradingBot

```typescript
interface CopyTradingBot {
  id: string; // UUID
  user_address: string; // User's wallet address
  user_private_key: string; // Encrypted private key
  target_address: string; // Target trader's address
  bot_name?: string; // Custom bot name
  status: "active" | "paused" | "stopped";
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

### CopyTradingTrade

```typescript
interface CopyTradingTrade {
  id: string; // UUID
  user_wallet_address: string; // User's wallet address
  bot_id: string; // Reference to bot
  symbol: string; // Trading symbol (e.g., "BTC-USD")
  market_id: string; // Market identifier
  action: "BUY" | "SELL" | "EXIT_LONG" | "EXIT_SHORT";
  order_type: "MARKET" | "LIMIT" | "STOP";
  leverage: number; // Leverage multiplier
  price: number; // Trade price
  quantity: number; // Trade quantity
  transaction_hash?: string; // Blockchain transaction hash
  order_id?: string; // Order identifier
  target_address?: string; // Target trader's address
  status: "PENDING" | "SUCCESS" | "FAILED";
  pnl?: number; // Profit/Loss
  fees?: number; // Transaction fees
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

### OrderData

```typescript
interface OrderData {
  address: string; // Trader's address
  market_id: string; // Market identifier
  order_type: number; // Order type (1-18)
  price: string; // Order price
  size: string; // Order size
  leverage: number; // Leverage multiplier
  order_id: string; // Unique order ID
  timestamp: string; // Order timestamp
  status: string; // Order status
  is_market_order?: boolean; // Market order flag
}
```

## Error Handling

### Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    // Additional error details
  }
}
```

### Common Error Codes

| Code                 | Description                | HTTP Status |
| -------------------- | -------------------------- | ----------- |
| `INVALID_REQUEST`    | Invalid request format     | 400         |
| `UNAUTHORIZED`       | Authentication required    | 401         |
| `FORBIDDEN`          | Insufficient permissions   | 403         |
| `NOT_FOUND`          | Resource not found         | 404         |
| `RATE_LIMITED`       | Too many requests          | 429         |
| `DATABASE_ERROR`     | Database operation failed  | 500         |
| `EXTERNAL_API_ERROR` | External API error         | 502         |
| `WEBSOCKET_ERROR`    | WebSocket connection error | 503         |

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General API**: 100 requests per minute per IP
- **WebSocket**: 10 connections per IP
- **Bot Operations**: 10 operations per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## WebSocket Events

### Client to Server

#### Subscribe to Bot Updates

```json
{
  "type": "subscribe",
  "data": {
    "channel": "bot_updates",
    "botId": "uuid"
  }
}
```

#### Unsubscribe from Updates

```json
{
  "type": "unsubscribe",
  "data": {
    "channel": "bot_updates",
    "botId": "uuid"
  }
}
```

### Server to Client

#### Bot Status Update

```json
{
  "type": "bot_status_update",
  "data": {
    "botId": "uuid",
    "status": "active",
    "message": "Bot activated successfully"
  }
}
```

#### Trade Execution

```json
{
  "type": "trade_execution",
  "data": {
    "botId": "uuid",
    "tradeId": "uuid",
    "status": "success",
    "transactionHash": "0x...",
    "symbol": "BTC-USD",
    "action": "BUY",
    "quantity": 0.001,
    "price": 45000.0
  }
}
```

## Integration Examples

### JavaScript/TypeScript

```typescript
// API Client
class SocialTradeAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async refreshBots(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/refresh-bots`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getHealth(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// WebSocket Client
class SocialTradeWebSocket {
  private ws: WebSocket;
  private callbacks: Map<string, Function[]> = new Map();

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  private handleMessage(message: any): void {
    const callbacks = this.callbacks.get(message.type) || [];
    callbacks.forEach((callback) => callback(message.data));
  }

  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  subscribe(botId: string): void {
    this.ws.send(
      JSON.stringify({
        type: "subscribe",
        data: { channel: "bot_updates", botId },
      })
    );
  }
}
```

### Python

```python
import requests
import websocket
import json

class SocialTradeAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def refresh_bots(self):
        response = requests.post(
            f'{self.base_url}/api/refresh-bots',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_health(self):
        response = requests.get(f'{self.base_url}/health')
        response.raise_for_status()
        return response.json()

class SocialTradeWebSocket:
    def __init__(self, url):
        self.url = url
        self.ws = None
        self.callbacks = {}

    def connect(self):
        self.ws = websocket.WebSocketApp(
            self.url,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        self.ws.run_forever()

    def on_message(self, ws, message):
        data = json.loads(message)
        callback = self.callbacks.get(data['type'])
        if callback:
            callback(data['data'])

    def on_error(self, ws, error):
        print(f"WebSocket error: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        print("WebSocket connection closed")

    def on(self, event, callback):
        self.callbacks[event] = callback

    def subscribe(self, bot_id):
        self.ws.send(json.dumps({
            'type': 'subscribe',
            'data': {'channel': 'bot_updates', 'botId': bot_id}
        }))
```

## Testing

### Health Check

```bash
curl -X GET https://api.socialtrade.com/health
```

### Bot Refresh

```bash
curl -X POST https://api.socialtrade.com/api/refresh-bots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### WebSocket Test

```javascript
const ws = new WebSocket("wss://api.socialtrade.com/ws");

ws.onopen = () => {
  console.log("Connected to WebSocket");

  // Subscribe to bot updates
  ws.send(
    JSON.stringify({
      type: "subscribe",
      data: { channel: "bot_updates", botId: "your-bot-id" },
    })
  );
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Received:", message);
};
```

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial API release
- Bot management endpoints
- WebSocket real-time updates
- Health monitoring
- Error handling and rate limiting

## Support

For API support:

- Check the troubleshooting section
- Review error logs
- Contact the development team
- Refer to the GitHub repository

---

**Note**: This API documentation is version 1.0.0. For the latest updates, please refer to the official documentation or contact the development team.
