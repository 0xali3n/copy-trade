import { config } from "./config";
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
 * Kana Labs API Client
 * Provides simple wrapper functions for making authenticated requests to Kana Labs API
 */

export interface KanaResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

/**
 * Make a GET request to Kana Labs API
 */
export async function kanaGet<T = any>(path: string): Promise<KanaResponse<T>> {
  const url = `${config.kanaRestUrl}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  try {
    console.log(`[kanaClient] Making GET request to: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": config.kanaApiKey,
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as any;

    console.log(`[kanaClient] Response status: ${response.status}`);
    console.log(`[kanaClient] Raw response:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
        message: data?.message || data?.error || "Unknown error",
        status: response.status,
      };
    }

    return { data: data as T, status: response.status };
  } catch (error) {
    console.error(`[kanaClient] GET request failed:`, error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Make a POST request to Kana Labs API
 */
export async function kanaPost<T = any>(
  path: string,
  body: any
): Promise<KanaResponse<T>> {
  const url = `${config.kanaRestUrl}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  try {
    console.log(`[kanaClient] Making POST request to: ${url}`);
    console.log(`[kanaClient] Request body:`, JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": config.kanaApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as any;

    console.log(`[kanaClient] Response status: ${response.status}`);
    console.log(`[kanaClient] Raw response:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
        message: data?.message || data?.error || "Unknown error",
        status: response.status,
      };
    }

    return { data: data as T, status: response.status };
  } catch (error) {
    console.error(`[kanaClient] POST request failed:`, error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if response contains an entry function payload (Aptos transaction format)
 */
export function hasEntryFunctionPayload(response: any): boolean {
  return (
    response &&
    typeof response === "object" &&
    response.entry_function_payload &&
    typeof response.entry_function_payload === "object"
  );
}

/**
 * Check if response contains raw transaction bytes (base64 format)
 */
export function hasRawTransaction(response: any): boolean {
  return (
    response &&
    typeof response === "object" &&
    (response.raw_tx || response.tx_bytes) &&
    typeof (response.raw_tx || response.tx_bytes) === "string"
  );
}

/**
 * Extract raw transaction bytes from response
 */
export function getRawTransaction(response: any): string | null {
  if (hasRawTransaction(response)) {
    return response.raw_tx || response.tx_bytes;
  }
  return null;
}

export interface LimitOrderParams {
  marketId: number;
  tradeSide: boolean; // true = long, false = short
  direction: boolean; // true = close, false = open
  size: number;
  price: number;
  leverage: number;
  restriction: number; // 0 = NO_RESTRICTION
}

export interface OrderResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export async function placeLimitOrder(
  params: LimitOrderParams
): Promise<OrderResult> {
  try {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(aptosConfig);

    const formattedPrivateKey = PrivateKey.formatPrivateKey(
      config.aptosPrivateKeyHex,
      "ed25519" as PrivateKeyVariants
    );
    const account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(formattedPrivateKey),
    });

    // Prepare request body
    const body = {
      marketId: params.marketId,
      orderType: true, // true = limit order
      tradeSide: params.tradeSide,
      direction: params.direction,
      size: params.size,
      price: params.price,
      leverage: params.leverage,
      restriction: params.restriction,
    };

    // Get transaction payload from Kana Labs API
    const response = await kanaPost("/placeLimitOrder", body);

    if (response.error) {
      return {
        success: false,
        error: response.error,
      };
    }

    const payloadData = response.data;

    // Build and submit transaction
    const transactionPayload = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: payloadData,
    });

    const committedTxn = await aptos.transaction.signAndSubmitTransaction({
      transaction: transactionPayload,
      signer: account,
    });

    // Wait for transaction confirmation
    const response2 = await aptos.waitForTransaction({
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
