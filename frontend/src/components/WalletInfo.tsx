import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const WalletInfo: React.FC = () => {
  const { user, createActiveAccount } = useAuth();
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  if (!user?.aptos_wallet_address) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Aptos Wallet</h3>
        <p className="text-gray-300 mb-4">
          No wallet created yet. Click the button below to generate your Aptos
          wallet.
        </p>
        <button
          onClick={createActiveAccount}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-4"
        >
          Create Aptos Wallet
        </button>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            ⚠️ Your wallet will be generated and stored securely in our
            database.
          </p>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log(`${label} copied to clipboard`);
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-4">Aptos Wallet</h3>

      <div className="space-y-4">
        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Wallet Address
          </label>
          <div className="flex items-center space-x-2">
            <code className="bg-black/20 text-green-400 px-3 py-2 rounded-lg text-sm font-mono flex-1">
              {user.aptos_wallet_address}
            </code>
            <button
              onClick={() =>
                copyToClipboard(user.aptos_wallet_address!, "Wallet address")
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Public Key - Hidden for Security */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Public Key
          </label>
          <div className="flex items-center space-x-2">
            <code className="bg-black/20 text-gray-500 px-3 py-2 rounded-lg text-sm font-mono flex-1">
              Hidden for security
            </code>
            <button
              onClick={() =>
                copyToClipboard(user.aptos_public_key!, "Public key")
              }
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Private Key */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Private Key
          </label>
          <div className="flex items-center space-x-2">
            <code className="bg-black/20 text-red-400 px-3 py-2 rounded-lg text-sm font-mono flex-1 break-all">
              {showPrivateKey
                ? user.aptos_private_key
                : "••••••••••••••••••••••••••••••••"}
            </code>
            <button
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              {showPrivateKey ? "Hide" : "Show"}
            </button>
            <button
              onClick={() =>
                copyToClipboard(user.aptos_private_key!, "Private key")
              }
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400 text-sm">
          ⚠️ <strong>Security Warning:</strong> Never share your private key
          with anyone. Keep it secure and never enter it on untrusted websites.
        </p>
      </div>
    </div>
  );
};

export default WalletInfo;
