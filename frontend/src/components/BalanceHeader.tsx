import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KanaService } from "../services/kana";

interface BalanceHeaderProps {
  onDepositClick: () => void;
  refreshTrigger?: number; // When this changes, refresh the balance
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({
  onDepositClick,
  refreshTrigger,
}) => {
  const { user } = useAuth();
  const [kana] = useState(() => new KanaService());
  const [tradingBalance, setTradingBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.aptos_wallet_address && user?.aptos_private_key) {
      const success = kana.initialize(user.aptos_private_key);
      if (success) {
        loadTradingBalance();
      }
    }
  }, [user?.aptos_wallet_address, user?.aptos_private_key]);

  // Refresh balance when refreshTrigger changes (e.g., when deposit popup closes)
  useEffect(() => {
    if (
      refreshTrigger &&
      user?.aptos_wallet_address &&
      user?.aptos_private_key
    ) {
      loadTradingBalance();
    }
  }, [refreshTrigger]);

  const loadTradingBalance = async () => {
    setLoading(true);
    try {
      // Only fetch trading balance, not wallet balance (reduces API calls)
      const tradingBal = await kana.getTradingBalance();
      setTradingBalance(tradingBal);
    } catch (error) {
      console.error("Error loading trading balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.aptos_wallet_address) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Trading Balance */}
      <div className="text-right">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Trading Balance
        </div>
        <div className="text-lg font-semibold text-white">
          {loading ? (
            <div className="animate-pulse">...</div>
          ) : tradingBalance !== null ? (
            `$${tradingBalance.toFixed(6)}`
          ) : (
            "$0.000000"
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadTradingBalance}
        disabled={loading}
        className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
        title="Refresh balance"
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

      {/* Deposit Button */}
      <button
        onClick={onDepositClick}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
      >
        Deposit
      </button>
    </div>
  );
};

export default BalanceHeader;
