import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const WalletConnection: React.FC = () => {
  const { connect, disconnect, connected, account, wallets, isLoading } =
    useWallet();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const copyAddress = async () => {
    if (account?.address) {
      try {
        await navigator.clipboard.writeText(account.address.toString());
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWalletIcon = (walletName: string) => {
    switch (walletName) {
      case "Petra":
        return "🦎";
      case "Martian":
        return "🚀";
      case "OKX Wallet":
        return "🔶";
      case "Pontem Wallet":
        return "🌉";
      default:
        return "🔗";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {connected && account ? (
        /* Connected State - Professional Style */
        <div className="relative">
          <button
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 hover:bg-white/20 transition-all duration-300"
          >
            <span className="text-lg">🔗</span>
            <span className="text-white font-mono text-sm">
              {formatAddress(account.address.toString())}
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </button>

          {/* Dropdown Menu */}
          {showWalletMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <p className="text-white font-semibold">Wallet Connected</p>
                    <p className="text-gray-300 text-sm">Connected</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-gray-400 text-xs mb-1">Wallet Address</p>
                  <div className="flex items-center justify-between">
                    <p className="text-white font-mono text-sm">
                      {formatAddress(account.address.toString())}
                    </p>
                    <button
                      onClick={copyAddress}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy address"
                    >
                      {showCopySuccess ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span>📋</span>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={disconnect}
                  className="w-full bg-red-500/20 border border-red-500/30 text-red-400 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-all duration-300"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Connect Button - Professional Style */
        <div className="relative">
          <button
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg px-4 py-2 font-semibold text-white transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>🔗</span>
                <span>Connect Wallet</span>
              </>
            )}
          </button>

          {/* Wallet Selection Dropdown */}
          {showWalletMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl">
              <div className="p-4">
                <h3 className="text-white font-semibold mb-3">Choose Wallet</h3>
                <div className="space-y-2">
                  {wallets.map((wallet) => (
                    <button
                      key={wallet.name}
                      onClick={() => connect(wallet.name)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300 bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-white"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {getWalletIcon(wallet.name)}
                        </span>
                        <span className="font-semibold">{wallet.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400 text-xs">
                          Available
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Install Instructions */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300 text-xs mb-2">
                    Don't have a wallet? Install one to get started.
                  </p>
                  <div className="space-y-1 text-xs">
                    <a
                      href="https://petra.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      🦎 Petra Wallet
                    </a>
                    <a
                      href="https://www.okx.com/web3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      🔶 OKX Wallet
                    </a>
                    <a
                      href="https://martianwallet.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      🚀 Martian Wallet
                    </a>
                    <a
                      href="https://pontem.network/wallet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      🌉 Pontem Wallet
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close menu */}
      {showWalletMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletMenu(false)}
        />
      )}
    </div>
  );
};

export default WalletConnection;
