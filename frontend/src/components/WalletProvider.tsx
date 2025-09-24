import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { WALLET_CONFIG } from "../config/wallet";

interface WalletProviderProps {
  children: React.ReactNode;
}

const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  return (
    <AptosWalletAdapterProvider
      autoConnect={WALLET_CONFIG.autoConnect}
      dappConfig={{
        network: WALLET_CONFIG.network,
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};

export default WalletProvider;
