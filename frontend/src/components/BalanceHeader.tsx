import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KanaService } from "../services/kana";

const BalanceHeader: React.FC = () => {
  const { user } = useAuth();
  const [kana] = useState(() => new KanaService());
  const [balances, setBalances] = useState<{
    wallet: number;
    trading: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.aptos_wallet_address && user?.aptos_private_key) {
      const success = kana.initialize(user.aptos_private_key);
      if (success) {
        loadBalances();
      }
    }
  }, [user?.aptos_wallet_address, user?.aptos_private_key]);

  const loadBalances = async () => {
    setLoading(true);
    try {
      const bal = await kana.getBalances();
      setBalances(bal);
    } catch (error) {
      console.error("Error loading balances:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.aptos_wallet_address) {
    return null;
  }

  return (
    <div className="flex items-center space-x-6">
      {/* Wallet Balance */}
      <div className="text-right">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Wallet
        </div>
        <div className="text-lg font-semibold text-white">
          {loading ? (
            <div className="animate-pulse">...</div>
          ) : balances ? (
            `$${balances.wallet.toFixed(2)}`
          ) : (
            "$0.00"
          )}
        </div>
      </div>

      {/* Trading Balance */}
      <div className="text-right">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Trading
        </div>
        <div className="text-lg font-semibold text-white">
          {loading ? (
            <div className="animate-pulse">...</div>
          ) : balances ? (
            `$${balances.trading.toFixed(6)}`
          ) : (
            "$0.000000"
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadBalances}
        disabled={loading}
        className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
        title="Refresh balances"
      >
        <svg
          className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
};

export default BalanceHeader;
