import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const WalletInfo: React.FC = () => {
  const { user } = useAuth();
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  if (!user?.aptos_wallet_address) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Aptos Wallet</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Generating your Aptos wallet...</p>
            <p className="text-gray-400 text-sm mt-2">
              This will only take a moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    console.log(`${label} copied to clipboard`);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-6">Aptos Wallet</h3>

      <div className="space-y-6">
        {/* Wallet Address - Professional Display */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Wallet Address
          </label>
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <div className="text-white font-mono text-lg">
                    {formatAddress(user.aptos_wallet_address)}
                  </div>
                  <div className="text-gray-400 text-xs">Aptos Mainnet</div>
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(user.aptos_wallet_address!, "Wallet address")
                }
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm transition-colors border border-blue-500/30"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Private Key - Hidden by Default */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Private Key
          </label>
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔑</span>
                </div>
                <div>
                  <div className="text-white font-mono text-lg">
                    {showPrivateKey
                      ? formatAddress(user.aptos_private_key!)
                      : "••••••••••••••••"}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {showPrivateKey ? "Private Key" : "Hidden for security"}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-3 py-2 rounded-lg text-sm transition-colors border border-gray-500/30"
                >
                  {showPrivateKey ? "Hide" : "Show"}
                </button>
                {showPrivateKey && (
                  <button
                    onClick={() =>
                      copyToClipboard(user.aptos_private_key!, "Private key")
                    }
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors border border-red-500/30"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPrivateKey && (
        <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            ⚠️ <strong>Security Warning:</strong> Never share your private key
            with anyone. Keep it secure and never enter it on untrusted
            websites.
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletInfo;
