import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KanaService } from "../services/kana";

const DepositFlow: React.FC = () => {
  const { user } = useAuth();
  const [kana] = useState(() => new KanaService());
  const [step, setStep] = useState<"deposit" | "transfer">("deposit");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState("1.00");

  if (!user?.aptos_wallet_address) {
    return null;
  }

  const handleDeposit = () => {
    setStep("deposit");
  };

  const handleTransfer = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatus("❌ Please enter a valid amount");
      return;
    }

    setLoading(true);
    setStatus(`Transferring $${amount.toFixed(2)} to trading account...`);

    try {
      const success = kana.initialize(user.aptos_private_key!);
      if (!success) {
        throw new Error("Failed to initialize Kana service");
      }

      const txHash = await kana.deposit(amount);
      setStatus(`✅ Transfer successful! TX: ${txHash.slice(0, 8)}...`);
    } catch (error) {
      setStatus(`❌ Transfer failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus("✅ Address copied to clipboard");
    setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-6">Deposit & Transfer</h3>

      {/* Status */}
      {status && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            status.includes("✅")
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : status.includes("❌")
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          }`}
        >
          {status}
        </div>
      )}

      {/* Deposit Step */}
      {step === "deposit" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">💰</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              Deposit to Wallet
            </h4>
            <p className="text-gray-400 text-sm">
              Send USDC to your wallet address below
            </p>
          </div>

          {/* Wallet Address */}
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-gray-300 mb-2">
              Your Wallet Address
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-white/5 rounded-lg p-3">
                <div className="text-white font-mono text-sm break-all">
                  {user.aptos_wallet_address}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(user.aptos_wallet_address!)}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm transition-colors border border-blue-500/30"
              >
                Copy
              </button>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-black/20 rounded-lg p-6 border border-white/10 text-center">
            <div className="w-32 h-32 bg-white/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-sm">QR Code</span>
            </div>
            <p className="text-gray-400 text-sm">
              Scan to send USDC to your wallet
            </p>
          </div>

          {/* Transfer Button */}
          <button
            onClick={() => setStep("transfer")}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            Transfer to Trading Account
          </button>
        </div>
      )}

      {/* Transfer Step */}
      {step === "transfer" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔄</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              Transfer to Trading
            </h4>
            <p className="text-gray-400 text-sm">
              Move funds from wallet to trading account
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transfer Amount (USD)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
              min="0.01"
              className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Transfer Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">ℹ️</span>
              <span className="text-blue-400 font-medium">
                Transfer Details
              </span>
            </div>
            <div className="text-blue-300 text-sm space-y-1">
              <div>• From: Your Aptos Wallet</div>
              <div>• To: Kana Labs Trading Account</div>
              <div>• Network: Aptos Mainnet</div>
              <div>• Gas: Paid automatically</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setStep("deposit")}
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 py-3 px-6 rounded-lg font-medium transition-colors border border-gray-500/30"
            >
              Back
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200"
            >
              {loading ? "Transferring..." : "Transfer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositFlow;
