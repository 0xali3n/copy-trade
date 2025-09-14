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
import { config, validateConfig, getTimestamp } from "./config";

interface ClosePositionParams {
  marketId: string;
  tradeSide: boolean; // false = short side to close long position
  direction: boolean; // true = close position
  size: number;
  price: number;
  leverage: number;
  restriction?: number;
}

interface CloseResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class PositionCloser {
  private aptos: Aptos;
  private account: Account;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);

    const formattedPrivateKey = PrivateKey.formatPrivateKey(
      config.aptosPrivateKey,
      "ed25519" as PrivateKeyVariants
    );
    this.account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(formattedPrivateKey),
    });
  }

  async closePosition(params: ClosePositionParams): Promise<CloseResult> {
    try {
      console.log(`${getTimestamp()} - Closing position...`);
      console.log(`  Market ID: ${params.marketId}`);
      console.log(
        `  Trade Side: ${
          params.tradeSide ? "Long" : "Short"
        } (to close long position)`
      );
      console.log(`  Direction: ${params.direction ? "Close" : "Open"}`);
      console.log(`  Size: ${params.size} BTC`);
      console.log(`  Price: $${params.price}`);
      console.log(`  Leverage: ${params.leverage}x`);

      // Build request body
      const body: any = {
        marketId: parseInt(params.marketId),
        tradeSide: params.tradeSide,
        direction: params.direction,
        size: params.size,
        price: params.price,
        leverage: params.leverage,
      };

      // Add optional parameters if provided
      if (params.restriction !== undefined) {
        body.restriction = params.restriction;
      }

      // Get transaction payload from Kana Labs API
      const response = await axios.post(
        `${config.kanaRestUrl}/placeLimitOrder`,
        body,
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
}

async function closeExistingPosition(): Promise<void> {
  try {
    validateConfig();
    const closer = new PositionCloser();

    console.log("CLOSE EXISTING POSITION - Starting...");
    console.log("Market ID: 15 | BTC Long Position");
    console.log("=".repeat(80));

    // Close the long position at current market price + some buffer
    const result = await closer.closePosition({
      marketId: "15",
      tradeSide: false, // Short side to close long position
      direction: true, // Close position
      size: 0.0001, // Size of your existing position
      price: 115300, // Close at $115,300 (adjust based on current price)
      leverage: 10, // Same leverage as your position
      restriction: 0, // NO_RESTRICTION
    });

    // Display result
    console.log("\n" + "=".repeat(80));
    console.log("CLOSE POSITION RESULT");
    console.log("=".repeat(80));

    if (result.success) {
      console.log("Status: SUCCESS");
      console.log(`Transaction Hash: ${result.transactionHash}`);
      console.log("Position Closed:");
      console.log("  - BTC Long Position Closed at $115,300");
      console.log("  - Size: 0.0001 BTC");
      console.log("  - Leverage: 10x");
    } else {
      console.log("Status: FAILED");
      console.log(`Error: ${result.error}`);
    }

    console.log("=".repeat(80));
  } catch (error) {
    console.error("Close position failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  closeExistingPosition();
}
