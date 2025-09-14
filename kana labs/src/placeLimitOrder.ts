import { config, validateConfig, getTimestamp } from "./config";
import { kanaGet } from "./kanaClient";
import {
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  Account,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";

/**
 * BTC Limit Order Placement Script for Kana Labs Perps
 *
 * Focus: BTC/USDC only with realistic prices around current market
 * Current BTC Market: Ask $1,140.50 | Bid $1,112.68 | Mid $1,126.59
 */

interface LimitOrderParams {
  marketId: string;
  tradeSide: boolean; // true = long, false = short
  direction: boolean; // false = open position, true = close position
  size: number;
  price: number;
  leverage: number;
  restriction?: number; // 0 = NO_RESTRICTION, 1 = FILL_OR_ABORT, 3 = POST_OR_ABORT
  takeProfit?: number;
  stopLoss?: number;
}

interface OrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  orderData?: any;
}

class BtcLimitOrderPlacer {
  private aptos: Aptos;
  private account: Account;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    this.aptos = new Aptos(aptosConfig);

    // Create account from private key
    const formattedPrivateKey = PrivateKey.formatPrivateKey(
      config.aptosPrivateKeyHex,
      "ed25519" as PrivateKeyVariants
    );
    this.account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(formattedPrivateKey),
    });
  }

  async placeLimitOrder(params: LimitOrderParams): Promise<OrderResult> {
    console.log(
      `[placeLimitOrder] ${getTimestamp()} - Placing BTC limit order...`
    );
    console.log(
      `[placeLimitOrder] ${getTimestamp()} - Trade Side: ${
        params.tradeSide ? "Long" : "Short"
      }`
    );
    console.log(
      `[placeLimitOrder] ${getTimestamp()} - Direction: ${
        params.direction ? "Close" : "Open"
      }`
    );
    console.log(
      `[placeLimitOrder] ${getTimestamp()} - Size: ${params.size} BTC`
    );
    console.log(
      `[placeLimitOrder] ${getTimestamp()} - Price: $${params.price}`
    );
    console.log(
      `[placeLimitOrder] ${getTimestamp()} - Leverage: ${params.leverage}x`
    );

    try {
      // Step 1: Get transaction payload from Kana Labs API
      console.log(
        `[placeLimitOrder] ${getTimestamp()} - Step 1: Getting transaction payload from Kana Labs...`
      );

      const payloadResult = await this.getTransactionPayload(params);
      if (!payloadResult.success) {
        return {
          success: false,
          error: payloadResult.error,
        };
      }

      console.log(
        `[placeLimitOrder] ${getTimestamp()} - ✅ Transaction payload received`
      );

      // Step 2: Submit transaction to Aptos blockchain
      console.log(
        `[placeLimitOrder] ${getTimestamp()} - Step 2: Submitting transaction to Aptos blockchain...`
      );

      const transactionResult = await this.submitTransaction(
        payloadResult.data
      );
      if (!transactionResult.success) {
        return {
          success: false,
          error: transactionResult.error,
        };
      }

      console.log(
        `[placeLimitOrder] ${getTimestamp()} - ✅ Transaction submitted successfully`
      );
      console.log(
        `[placeLimitOrder] ${getTimestamp()} - Transaction Hash: ${
          transactionResult.transactionHash
        }`
      );

      return {
        success: true,
        transactionHash: transactionResult.transactionHash,
        orderData: payloadResult.data,
      };
    } catch (error) {
      console.error(
        `[placeLimitOrder] ${getTimestamp()} - ❌ Order placement failed:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async getTransactionPayload(
    params: LimitOrderParams
  ): Promise<{ success: boolean; data?: any; error?: string }> {
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

      const response = await kanaGet(
        `/placeLimitOrder?${queryParams.toString()}`
      );

      if (response.error) {
        return {
          success: false,
          error: `Failed to get transaction payload: ${response.error}`,
        };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API returned error: ${
            response.data?.message || "Unknown error"
          }`,
        };
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get transaction payload",
      };
    }
  }

  private async submitTransaction(
    payloadData: any
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Build transaction using the payload from Kana Labs
      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: payloadData,
      });

      // Sign and submit transaction
      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: this.account,
        });

      // Wait for transaction confirmation
      const response = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (response.success) {
        return {
          success: true,
          transactionHash: committedTxn.hash,
        };
      } else {
        return {
          success: false,
          error: "Transaction failed on blockchain",
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Transaction submission failed",
      };
    }
  }
}

// Test BTC limit orders around current market price
async function testBtcLimitOrders(): Promise<void> {
  try {
    validateConfig();

    const placer = new BtcLimitOrderPlacer();

    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - ==========================================`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - BTC LIMIT ORDER TESTS`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Current Market: Ask $1,140.50 | Bid $1,112.68 | Mid $1,126.59`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - ==========================================`
    );

    // Test 1: BTC Long Limit Order - Price slightly below current bid (should work)
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 1: BTC Long Limit Order at $1,110 (below bid)`
    );

    const result1 = await placer.placeLimitOrder({
      marketId: "1339", // BTC/USDC
      tradeSide: true, // Long
      direction: false, // Open position
      size: 0.0001, // 0.01 BTC
      price: 111000, // $1,110 (slightly below current bid $1,112.68)
      leverage: 1, // 1x leverage
      restriction: 0, // NO_RESTRICTION
    });

    if (result1.success) {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ✅ Test 1 SUCCESS: ${
          result1.transactionHash
        }`
      );
    } else {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ❌ Test 1 FAILED: ${
          result1.error
        }`
      );
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test 2: BTC Short Limit Order - Price slightly above current ask (should work)
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 2: BTC Short Limit Order at $1,145 (above ask)`
    );

    const result2 = await placer.placeLimitOrder({
      marketId: "1339", // BTC/USDC
      tradeSide: false, // Short
      direction: false, // Open position
      size: 0.0001, // 0.01 BTC
      price: 114500, // $1,145 (slightly above current ask $1,140.50)
      leverage: 2, // 2x leverage
      restriction: 0, // NO_RESTRICTION
    });

    if (result2.success) {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ✅ Test 2 SUCCESS: ${
          result2.transactionHash
        }`
      );
    } else {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ❌ Test 2 FAILED: ${
          result2.error
        }`
      );
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test 3: BTC Long Limit Order - Price at mid market (should work)
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 3: BTC Long Limit Order at $1,125 (mid market)`
    );

    const result3 = await placer.placeLimitOrder({
      marketId: "1339", // BTC/USDC
      tradeSide: true, // Long
      direction: false, // Open position
      size: 0.0001, // 0.01 BTC
      price: 112500, // $1,125 (close to mid market $1,126.59)
      leverage: 3, // 3x leverage
      restriction: 0, // NO_RESTRICTION
    });

    if (result3.success) {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ✅ Test 3 SUCCESS: ${
          result3.transactionHash
        }`
      );
    } else {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ❌ Test 3 FAILED: ${
          result3.error
        }`
      );
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test 4: BTC Long Limit Order with Take Profit and Stop Loss
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 4: BTC Long with TP/SL at $1,12000`
    );

    const result4 = await placer.placeLimitOrder({
      marketId: "1339", // BTC/USDC
      tradeSide: true, // Long
      direction: false, // Open position
      size: 0.0001, // 0.01 BTC
      price: 112000, // $1,120 (below mid market)
      leverage: 2, // 2x leverage
      restriction: 0, // NO_RESTRICTION
      takeProfit: 115000, // Take profit at $1,150
      stopLoss: 110000, // Stop loss at $1,100
    });

    if (result4.success) {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ✅ Test 4 SUCCESS: ${
          result4.transactionHash
        }`
      );
    } else {
      console.log(
        `[testBtcLimitOrders] ${getTimestamp()} - ❌ Test 4 FAILED: ${
          result4.error
        }`
      );
    }

    // Summary
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - ==========================================`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - BTC LIMIT ORDER TEST SUMMARY`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - ==========================================`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 1 (Long at $1,110): ${
        result1.success ? "✅ SUCCESS" : "❌ FAILED"
      }`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 2 (Short at $1,145): ${
        result2.success ? "✅ SUCCESS" : "❌ FAILED"
      }`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 3 (Long at $1,125): ${
        result3.success ? "✅ SUCCESS" : "❌ FAILED"
      }`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - Test 4 (Long with TP/SL): ${
        result4.success ? "✅ SUCCESS" : "❌ FAILED"
      }`
    );
    console.log(
      `[testBtcLimitOrders] ${getTimestamp()} - ==========================================`
    );
  } catch (error) {
    console.error(
      `[testBtcLimitOrders] ${getTimestamp()} - ❌ Test suite failed:`,
      error
    );
    process.exit(1);
  }
}

// Run the BTC limit order tests
if (require.main === module) {
  testBtcLimitOrders();
}
