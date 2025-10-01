import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KanaService, isKanaConfigured } from "../services/kana";

const Kana: React.FC = () => {
  const { user } = useAuth();
  const [kana] = useState(() => new KanaService());
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<string>("Not connected");
  const [balances, setBalances] = useState<{
    wallet: number;
    trading: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1.00");

  useEffect(() => {
    if (user?.aptos_wallet_address && user?.aptos_private_key) {
      const success = kana.initialize(user.aptos_private_key);
      if (success) {
        setIsReady(true);
        setStatus("✅ Connected to Kana Labs");
        loadBalances();
      } else {
        setStatus("❌ Failed to initialize");
      }
    } else {
      setIsReady(false);
      setStatus("Create wallet to connect to Kana Labs");
    }
  }, [user?.aptos_wallet_address, user?.aptos_private_key]);

  const loadBalances = async () => {
    if (!isReady) return;

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

  const testConnection = async () => {
    setLoading(true);
    setStatus("Testing connection...");

    try {
      const success = await kana.testConnection();
      setStatus(success ? "✅ Connection successful" : "❌ Connection failed");
    } catch (error) {
      setStatus(`❌ Connection failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatus("❌ Please enter a valid amount");
      return;
    }

    setLoading(true);
    setStatus(`Depositing $${amount.toFixed(2)}...`);

    try {
      const txHash = await kana.deposit(amount);
      setStatus(`✅ Deposit successful! TX: ${txHash.slice(0, 8)}...`);
      setTimeout(loadBalances, 3000);
    } catch (error) {
      setStatus(`❌ Deposit failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const configured = isKanaConfigured();

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-4">Kana Labs</h3>

      {/* API Key Status */}
      <div className="mb-4">
        <span className="text-sm text-gray-300">API Key: </span>
        <span
          className={`text-sm font-medium ${
            configured ? "text-green-400" : "text-red-400"
          }`}
        >
          {configured ? "Configured" : "Missing"}
        </span>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <span className="text-sm text-gray-300">Status: </span>
        <span
          className={`text-sm font-medium ${
            status.includes("✅")
              ? "text-green-400"
              : status.includes("❌")
              ? "text-red-400"
              : "text-yellow-400"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-gray-300 mb-1">Wallet</div>
          <div className="text-xl font-bold text-white">
            {loading
              ? "..."
              : balances
              ? `$${balances.wallet.toFixed(2)}`
              : "N/A"}
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-gray-300 mb-1">Trading</div>
          <div className="text-xl font-bold text-white">
            {loading
              ? "..."
              : balances
              ? `$${balances.trading.toFixed(6)}`
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={testConnection}
            disabled={!isReady || loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded text-sm"
          >
            Test
          </button>
          <button
            onClick={loadBalances}
            disabled={!isReady || loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Deposit */}
        <div className="border-t border-white/10 pt-4">
          <div className="text-sm text-gray-300 mb-2">Deposit</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount"
              step="0.01"
              min="0.01"
              className="flex-1 bg-black/20 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-400"
            />
            <button
              onClick={handleDeposit}
              disabled={!isReady || loading}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kana;
