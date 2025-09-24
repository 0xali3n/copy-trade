import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletReadyState } from "@aptos-labs/wallet-adapter-react";

const WalletConnection: React.FC = () => {
  const { connect, disconnect, account, connected, wallet, wallets } =
    useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (walletName: string) => {
    try {
      setIsConnecting(true);
      const selectedWallet = wallets.find((w) => w.name === walletName);
      if (selectedWallet) {
        await connect(walletName);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  // Filter wallets that are available (installed or can be installed)
  const availableWallets = wallets.filter(
    (wallet) =>
      wallet.readyState === WalletReadyState.Installed ||
      wallet.readyState === WalletReadyState.NotDetected
  );

  if (connected && account) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✓</span>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Wallet Connected
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Connected with {wallet?.name}
          </p>

          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs mb-1">Address</p>
            <p className="text-white text-sm font-mono break-all">
              {account.address.toString()}
            </p>
          </div>

          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 w-full"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-3xl font-bold">🔗</span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-300 text-lg">
          Choose your preferred Aptos wallet to get started with copy trading
        </p>
      </div>

      <div className="grid gap-4">
        {availableWallets.map((wallet) => {
          const isInstalled = wallet.readyState === WalletReadyState.Installed;
          const isNotDetected =
            wallet.readyState === WalletReadyState.NotDetected;

          return (
            <button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              disabled={isConnecting || isNotDetected}
              className={`
                flex items-center justify-between p-4 rounded-lg border transition-all duration-300
                ${
                  isInstalled
                    ? "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                    : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                }
                ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {wallet.name.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">{wallet.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {isInstalled ? "Ready to connect" : "Not installed"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isInstalled ? (
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                ) : (
                  <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                )}
                <span className="text-white text-lg">→</span>
              </div>
            </button>
          );
        })}
      </div>

      {availableWallets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No wallets detected</p>
          <p className="text-gray-500 text-sm">
            Please install an Aptos wallet extension to continue
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Don't have a wallet?{" "}
          <a
            href="https://petra.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Get Petra Wallet
          </a>
        </p>
      </div>
    </div>
  );
};

export default WalletConnection;
