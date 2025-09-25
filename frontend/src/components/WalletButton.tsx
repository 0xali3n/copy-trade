import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletReadyState } from "@aptos-labs/wallet-adapter-react";
import { useAuth } from "../contexts/AuthContext";

const WalletButton: React.FC = () => {
  const { connect, disconnect, account, connected, wallet, wallets } =
    useWallet();
  const { user, isAuthenticated, createActiveAccount, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleConnect = async (walletName: string) => {
    try {
      setIsConnecting(true);
      await connect(walletName);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const handleCreateActiveAccount = async () => {
    try {
      await createActiveAccount();
    } catch (error) {
      console.error("Failed to create active account:", error);
    }
  };

  // Filter available wallets
  const availableWallets = wallets.filter(
    (wallet) =>
      wallet.readyState === WalletReadyState.Installed ||
      wallet.readyState === WalletReadyState.NotDetected
  );

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Show loading state while checking for existing account
  if (connected && account && isAuthenticated && isLoading) {
    return (
      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        <span className="text-white text-sm font-medium">Loading...</span>
      </div>
    );
  }

  if (connected && account && isAuthenticated) {
    return (
      <div className="flex items-center space-x-3">
        {/* Create Active Account Button */}
        {!user?.aptos_wallet_address && (
          <button
            onClick={handleCreateActiveAccount}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Create Active Account</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </>
            )}
          </button>
        )}

        {/* Show Active Account Address */}
        {user?.aptos_wallet_address && (
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-white text-sm font-medium">
              Active: {formatAddress(user.aptos_wallet_address)}
            </span>
          </div>
        )}

        {/* Wallet Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-white text-sm font-medium">
              {formatAddress(account.address.toString())}
            </span>
            <svg
              className={`w-4 h-4 text-white transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl z-50">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {wallet?.name?.charAt(0) || "W"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {wallet?.name || "Wallet"}
                    </h3>
                    <p className="text-gray-300 text-sm">Connected</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-gray-400 text-xs mb-1">Connected Wallet</p>
                  <p className="text-white text-sm font-mono break-all">
                    {account.address.toString()}
                  </p>
                </div>

                {user?.aptos_wallet_address && (
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-gray-400 text-xs mb-1">Active Account</p>
                    <p className="text-white text-sm font-mono break-all">
                      {user.aptos_wallet_address}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleDisconnect}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isConnecting}
        className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span>Connect Wallet</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl z-50">
          <div className="p-4">
            <h3 className="text-white font-semibold mb-4">Select Wallet</h3>

            <div className="space-y-2">
              {availableWallets.map((wallet) => {
                const isInstalled =
                  wallet.readyState === WalletReadyState.Installed;
                const isNotDetected =
                  wallet.readyState === WalletReadyState.NotDetected;

                return (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    disabled={isNotDetected || isConnecting}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300
                      ${
                        isInstalled
                          ? "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                          : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                      }
                      ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {wallet.name.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-white font-medium">
                          {wallet.name}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {isInstalled ? "Ready to connect" : "Not installed"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isInstalled ? (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      ) : (
                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      )}
                      <span className="text-white text-lg">→</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {availableWallets.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-2">No wallets detected</p>
                <p className="text-gray-500 text-sm">
                  Please install an Aptos wallet extension
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm text-center">
                Don't have a wallet?{" "}
                <a
                  href="https://petra.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Get Petra Wallet
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletButton;
