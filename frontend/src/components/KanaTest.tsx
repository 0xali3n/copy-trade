import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KanaService } from "../services/kanaService";
import { validateKanaConfig } from "../config/kanaConfig";
import Deposit from "./Deposit";

const KanaTest: React.FC = () => {
  const { user, createActiveAccount, isLoading: authLoading } = useAuth();
  const [kanaService] = useState(() => new KanaService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [profileBalance, setProfileBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.aptos_private_key) {
      const initResult = kanaService.initializeWithPrivateKey(
        user.aptos_private_key
      );
      if (initResult) {
        setIsInitialized(true);
        setConnectionStatus("✅ Kana service initialized successfully!");
        getBalances(); // Fetch balances immediately after initialization
      } else {
        setIsInitialized(false);
        setConnectionStatus("❌ Initialization failed");
      }
    } else {
      setIsInitialized(false);
      setConnectionStatus(
        "Create an active account to start using Kana Labs integration"
      );
    }
  }, [user?.aptos_private_key]);

  const testConnection = async () => {
    if (!isInitialized) {
      setConnectionStatus("❌ Kana service not initialized");
      return;
    }

    setIsLoading(true);
    setConnectionStatus("Testing connection...");
    try {
      const result = await kanaService.testConnection();
      if (result.success) {
        setConnectionStatus("✅ Connected to Kana Labs!");
      } else {
        setConnectionStatus(`❌ Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus(
        `❌ Connection test error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getBalances = async () => {
    if (!isInitialized) {
      setConnectionStatus("❌ Kana service not initialized");
      return;
    }

    setIsLoading(true);

    try {
      // Get wallet balance
      const walletResult = await kanaService.getWalletAccountBalance();
      if (walletResult.success) {
        setWalletBalance(walletResult.balance || 0);
      } else {
        console.error("Wallet balance error:", walletResult.error);
      }

      // Get profile balance
      const profileResult = await kanaService.getProfileBalanceSnapshot();
      if (profileResult.success) {
        setProfileBalance(profileResult.balance || 0);
      } else {
        console.error("Profile balance error:", profileResult.error);
      }
    } catch (error) {
      console.error("Balance fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepositSuccess = () => {
    // Refresh balances after successful deposit
    getBalances();
  };

  const handleCreateActiveAccount = async () => {
    try {
      await createActiveAccount();
      setConnectionStatus("✅ Active account created successfully!");
    } catch (error) {
      setConnectionStatus("❌ Failed to create active account");
    }
  };

  const configValidation = validateKanaConfig();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">
        Kana Labs Integration Test
      </h3>

      {/* Configuration Status */}
      <div className="mb-4">
        <p className="text-gray-300 text-sm">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-2 ${
              configValidation.isValid ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          Kana Labs API key configured:{" "}
          {configValidation.isValid ? "✅ Yes" : "❌ No"}
        </p>
        {!configValidation.isValid && (
          <p className="text-red-400 text-xs mt-1">
            {configValidation.errors.join(", ")}
          </p>
        )}
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="mb-4">
          <p
            className={`text-sm ${
              connectionStatus.includes("✅")
                ? "text-green-400"
                : connectionStatus.includes("❌")
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {connectionStatus}
          </p>
        </div>
      )}

      {/* Account Info */}
      {isInitialized && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Account Info</h4>
          <p className="text-gray-300 text-sm break-all">
            <strong>Active Account:</strong> {kanaService.getAccountAddress()}
          </p>
          {walletBalance !== null && (
            <p className="text-gray-300 text-sm">
              <strong>Wallet Balance:</strong> ${walletBalance.toFixed(2)}
            </p>
          )}
          {profileBalance !== null && (
            <p className="text-gray-300 text-sm">
              <strong>Profile Balance:</strong> ${profileBalance.toFixed(6)}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {!user?.aptos_wallet_address && (
          <button
            onClick={handleCreateActiveAccount}
            disabled={authLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
          >
            {authLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2"></div>
                Creating...
              </>
            ) : (
              "Create Active Account"
            )}
          </button>
        )}

        <button
          onClick={testConnection}
          disabled={!isInitialized || isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
        >
          {isLoading ? "Testing..." : "Test Connection"}
        </button>

        <button
          onClick={getBalances}
          disabled={!isInitialized || isLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
        >
          {isLoading ? "Loading..." : "Get Balances"}
        </button>
      </div>

      {/* Deposit Component */}
      {isInitialized && (
        <div className="mt-6">
          <Deposit
            kanaService={kanaService}
            onDepositSuccess={handleDepositSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default KanaTest;
