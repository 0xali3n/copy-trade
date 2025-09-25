import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KanaService } from "../services/kanaService";

interface DepositProps {
  kanaService: KanaService;
  onDepositSuccess?: () => void;
}

const Deposit: React.FC<DepositProps> = ({ kanaService, onDepositSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositStatus, setDepositStatus] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [tradingBalance, setTradingBalance] = useState<number | null>(null);

  // Load balances when component mounts
  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      // Get wallet balance
      const walletResult = await kanaService.getWalletAccountBalance();
      if (walletResult.success) {
        setWalletBalance(walletResult.balance || 0);
      }

      // Get trading balance
      const tradingResult = await kanaService.getProfileBalanceSnapshot();
      if (tradingResult.success) {
        setTradingBalance(tradingResult.balance || 0);
      }
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  const handleDepositToTrading = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setDepositStatus("❌ Please enter a valid amount");
      return;
    }

    if (!user?.aptos_wallet_address) {
      setDepositStatus("❌ No active account found");
      return;
    }

    setIsDepositing(true);
    setDepositStatus("🔄 Depositing to Kana Labs trading account...");

    try {
      // Use Kana service to deposit to trading account
      const result = await kanaService.depositFunds(parseFloat(amount));

      if (result.success) {
        setDepositStatus("✅ Deposit to trading account successful!");
        setTransactionHash(result.transactionHash || "");
        setAmount(""); // Clear the input

        // Reload balances
        await loadBalances();

        // Call success callback
        if (onDepositSuccess) {
          onDepositSuccess();
        }
      } else {
        setDepositStatus(`❌ Deposit failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setDepositStatus(`❌ Deposit error: ${errorMessage}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const copyAddress = () => {
    if (user?.aptos_wallet_address) {
      navigator.clipboard.writeText(user.aptos_wallet_address);
      setDepositStatus("✅ Address copied to clipboard!");
      setTimeout(() => setDepositStatus(""), 3000);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">
        Deposit to Trading Account
      </h3>

      {/* Step 1: Manual Deposit Instructions */}
      <div className="mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <h4 className="text-blue-400 font-semibold mb-3">
          📋 Step 1: Manual USDT Deposit
        </h4>
        <div className="space-y-3">
          <p className="text-blue-300 text-sm">
            1. Copy the active account address below
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-white text-sm break-all font-mono bg-white/5 p-2 rounded flex-1">
              {user?.aptos_wallet_address}
            </p>
            <button
              onClick={copyAddress}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded transition-all duration-300"
            >
              Copy
            </button>
          </div>
          <p className="text-blue-300 text-sm">
            2. Transfer USDT to this address in your wallet
          </p>
          <p className="text-blue-300 text-sm">
            3. Click "Refresh Balances" to see your wallet balance
          </p>
        </div>
      </div>

      {/* Balances */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">💰 Wallet Balance</h4>
          <p className="text-2xl font-bold text-green-400">
            ${walletBalance !== null ? walletBalance.toFixed(2) : "0.00"}
          </p>
          <p className="text-gray-400 text-sm">USDT in your active account</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">📊 Trading Balance</h4>
          <p className="text-2xl font-bold text-blue-400">
            ${tradingBalance !== null ? tradingBalance.toFixed(6) : "0.000000"}
          </p>
          <p className="text-gray-400 text-sm">
            USDT in Kana Labs trading account
          </p>
        </div>
      </div>

      {/* Step 2: Deposit to Trading */}
      <div className="mb-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
        <h4 className="text-green-400 font-semibold mb-3">
          🚀 Step 2: Deposit to Trading Account
        </h4>
        <p className="text-green-300 text-sm mb-4">
          Move USDT from your wallet to Kana Labs trading account for trading
        </p>

        <div className="flex space-x-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            disabled={isDepositing}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 disabled:opacity-50"
          />
          <button
            onClick={handleDepositToTrading}
            disabled={isDepositing || !amount || parseFloat(amount) <= 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300"
          >
            {isDepositing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2"></div>
                Depositing...
              </>
            ) : (
              "Deposit to Trading"
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mb-4">
        <button
          onClick={loadBalances}
          disabled={isDepositing}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
        >
          Refresh Balances
        </button>
      </div>

      {/* Status */}
      {depositStatus && (
        <div className="mb-4 p-3 rounded-lg border">
          <p
            className={`text-sm ${
              depositStatus.includes("✅")
                ? "text-green-400"
                : depositStatus.includes("❌")
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {depositStatus}
          </p>
        </div>
      )}

      {/* Transaction Hash */}
      {transactionHash && (
        <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <h4 className="text-green-400 font-semibold mb-2">
            Transaction Hash
          </h4>
          <p className="text-green-300 text-sm break-all font-mono">
            {transactionHash}
          </p>
          <a
            href={`https://explorer.aptoslabs.com/txn/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline mt-2 inline-block"
          >
            View on Aptos Explorer →
          </a>
        </div>
      )}

      {/* Quick Amount Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setAmount("1")}
          disabled={isDepositing}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm py-1 px-3 rounded transition-all duration-300"
        >
          $1
        </button>
        <button
          onClick={() => setAmount("5")}
          disabled={isDepositing}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm py-1 px-3 rounded transition-all duration-300"
        >
          $5
        </button>
        <button
          onClick={() => setAmount("10")}
          disabled={isDepositing}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm py-1 px-3 rounded transition-all duration-300"
        >
          $10
        </button>
        <button
          onClick={() => setAmount("25")}
          disabled={isDepositing}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm py-1 px-3 rounded transition-all duration-300"
        >
          $25
        </button>
      </div>
    </div>
  );
};

export default Deposit;
