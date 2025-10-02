import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KanaService } from "../services/kana";
import { AutoFundService } from "../services/autoFundService";
import QRCode from "qrcode";

interface DepositPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete: () => void;
}

const DepositPopup: React.FC<DepositPopupProps> = ({
  isOpen,
  onClose,
  onTransferComplete,
}) => {
  const { user } = useAuth();
  const [kana] = useState(() => new KanaService());
  const [autoFund] = useState(() => new AutoFundService());
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [lastBalanceCheck, setLastBalanceCheck] = useState<number>(0);

  useEffect(() => {
    if (isOpen && user?.aptos_wallet_address && user?.aptos_private_key) {
      const success = kana.initialize(user.aptos_private_key);
      if (success) {
        // Initialize auto-fund service
        autoFund.initialize();
        // Only check wallet balance when popup opens, not automatically
        checkWalletBalance();
        generateQRCode();
      }
    }
  }, [isOpen, user?.aptos_wallet_address, user?.aptos_private_key]);

  const checkAndFundWallet = async () => {
    if (!user?.aptos_wallet_address) return;

    setStatus("🔍 Checking if wallet needs gas funding...");

    try {
      const result = await autoFund.checkAndFundWallet(
        user.aptos_wallet_address
      );

      if (result.funded) {
        setStatus(
          `✅ Wallet funded with 0.1 APT! TX: ${result.txHash?.slice(0, 8)}...`
        );
        setTimeout(() => setStatus(""), 3000);
      } else if (result.error) {
        if (result.error.includes("Gas wallet has insufficient balance")) {
          setStatus(
            `❌ Gas wallet needs funding! Please fund the gas wallet first.`
          );
        } else {
          setStatus(`⚠️ ${result.message}`);
        }
        setTimeout(() => setStatus(""), 5000);
      } else {
        // Wallet already has sufficient funds or was already funded
        console.log(`[DepositPopup] ${result.message}`);
      }
    } catch (error) {
      console.error("Error checking/funding wallet:", error);
      setStatus("⚠️ Could not check wallet funding status");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const generateQRCode = async () => {
    if (user?.aptos_wallet_address) {
      try {
        const qrUrl = await QRCode.toDataURL(user.aptos_wallet_address, {
          width: 200,
          margin: 2,
          color: {
            dark: "#FFFFFF",
            light: "#000000",
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }
  };

  const checkWalletBalance = async () => {
    if (!user?.aptos_wallet_address || !user?.aptos_private_key) return;

    try {
      // Only get wallet balance on popup open (reduces API calls)
      const walletBal = await kana.getWalletBalance();
      setWalletBalance(walletBal);
    } catch (error) {
      console.error("Error checking wallet balance:", error);
    }
  };

  const autoTransfer = async (amount: number) => {
    setTransferring(true);
    setStatus(
      `🔄 Auto-transferring $${amount.toFixed(2)} to trading account...`
    );

    try {
      const txHash = await kana.deposit(amount);
      setStatus(`✅ Transfer successful! TX: ${txHash.slice(0, 8)}...`);

      setTimeout(() => {
        onTransferComplete();
      }, 3000);
    } catch (error) {
      setStatus(`❌ Transfer failed: ${error}`);
    } finally {
      setTransferring(false);
    }
  };

  const checkForDeposits = async () => {
    if (!user?.aptos_wallet_address || !user?.aptos_private_key) return;

    // Avoid checking too frequently (max once every 5 seconds)
    const now = Date.now();
    if (now - lastBalanceCheck < 5000) {
      setStatus("⏳ Please wait before checking again...");
      setTimeout(() => setStatus(""), 2000);
      return;
    }

    setStatus("🔍 Checking for deposits...");
    setCheckingBalance(true);
    setLastBalanceCheck(now);

    try {
      // Only get wallet balance, not trading balance (reduces API calls)
      const currentBalance = await kana.getWalletBalance();
      setWalletBalance(currentBalance);

      if (currentBalance > 0) {
        setStatus(
          `💰 Found wallet balance: $${currentBalance.toFixed(
            2
          )} - Checking gas funding...`
        );

        // Check and fund wallet for gas if needed (only when USDT is detected)
        await checkAndFundWallet();

        // Wait a moment for funding to complete, then transfer
        setTimeout(async () => {
          setStatus("🔄 Auto-transferring to trading account...");
          await autoTransfer(currentBalance);
        }, 2000);
      } else {
        setStatus("✅ No funds in wallet - Ready for new deposits");
        setTimeout(() => setStatus(""), 2000);
      }
    } catch (error) {
      console.error("Error checking for deposits:", error);
      setStatus("❌ Error checking for deposits");
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleClose = () => {
    // Close immediately - no waiting
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus("✅ Address copied to clipboard");
    setTimeout(() => setStatus(""), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-80 p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">💰</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Deposit</h3>
          <p className="text-gray-400 text-xs">Send USDT to your wallet</p>
        </div>

        {/* Status */}
        {status && (
          <div
            className={`mb-3 p-2 rounded-lg text-xs ${
              status.includes("✅")
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : status.includes("❌")
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : status.includes("💰")
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : status.includes("🔄")
                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}
          >
            {status}
          </div>
        )}

        {/* Wallet Address */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/10 mb-3">
          <div className="text-xs text-gray-300 mb-2">Wallet Address</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-white/5 rounded-lg p-2">
              <div className="text-white font-mono text-xs break-all">
                {user?.aptos_wallet_address}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(user?.aptos_wallet_address || "")}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1 rounded text-xs transition-colors border border-blue-500/30"
            >
              Copy
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-black/20 rounded-lg p-4 border border-white/10 text-center mb-3">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-24 h-24 mx-auto mb-2 rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-white/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
          <p className="text-gray-400 text-xs">Scan to send USDT</p>
        </div>

        {/* Check for Deposits Button */}
        <div className="mb-3">
          <button
            onClick={checkForDeposits}
            disabled={checkingBalance || transferring}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
          >
            {checkingBalance
              ? "Checking..."
              : transferring
              ? "Transferring..."
              : "Check for Deposits"}
          </button>
        </div>

        {/* Current Balance */}
        <div className="bg-black/20 rounded-lg p-2 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-xs">Wallet Balance</span>
            <span className="text-white font-semibold text-sm">
              {checkingBalance ? (
                <div className="animate-pulse">...</div>
              ) : (
                `$${walletBalance.toFixed(2)}`
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPopup;
