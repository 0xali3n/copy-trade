import { Network } from "@aptos-labs/ts-sdk";

export const APTOS_NETWORK = Network.DEVNET; // Change to Network.MAINNET for production

export const WALLET_CONFIG = {
  network: APTOS_NETWORK,
  autoConnect: false, // Set to true if you want wallets to auto-connect
};
