import { kanaConfig } from "../config/kanaConfig";

/**
 * Kana Labs API Client for Frontend
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
  const url = `${kanaConfig.kanaRestUrl}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": kanaConfig.kanaApiKey,
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
        message: data?.message || data?.error || "Unknown error",
        status: response.status,
      };
    }

    return { data: data as T, status: response.status };
  } catch (error) {
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
  const url = `${kanaConfig.kanaRestUrl}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": kanaConfig.kanaApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
        message: data?.message || data?.error || "Unknown error",
        status: response.status,
      };
    }

    return { data: data as T, status: response.status };
  } catch (error) {
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
