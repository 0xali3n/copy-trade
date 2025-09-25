// src/App.tsx
import React from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAuth } from "./contexts/AuthContext";
import WalletButton from "./components/WalletButton";
import LoadingSpinner from "./components/LoadingSpinner";
import KanaTest from "./components/KanaTest";

const App: React.FC = () => {
  const { connected } = useWallet();
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">K</span>
            </div>
            <span className="text-white text-xl font-bold">
              Kana Copy Trader
            </span>
          </div>

          <WalletButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-4xl mx-auto">
          {isLoading ? (
            <LoadingSpinner size="lg" text="Initializing authentication..." />
          ) : !connected || !isAuthenticated ? (
            <>
              {/* Logo */}
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <span className="text-white text-4xl font-bold">K</span>
              </div>

              {/* Title */}
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
                Kana Copy
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {" "}
                  Trader
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Professional copy trading for Kana Labs Perpetual Futures.
                Advanced trading tools and strategies for successful trading.
              </p>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Real-time
                  </h3>
                  <p className="text-gray-300 text-sm">
                    WebSocket-powered instant order detection and execution
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    All Orders
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Supports all 12 order types including Market, Limit, and
                    Stop orders
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">🛡️</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Safe</h3>
                  <p className="text-gray-300 text-sm">
                    Advanced risk management with position sizing controls
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  Ready to start your trading journey? Connect your wallet above
                  to get started.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Simple Dashboard */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Kana Labs Integration
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                  Welcome! Your wallet is connected and active account is ready.
                </p>

                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Active Account
                    </h3>
                    <p className="text-gray-300 mb-2">
                      <strong>Wallet Address:</strong> {user?.wallet_address}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <strong>Active Account:</strong>{" "}
                      {user?.aptos_wallet_address}
                    </p>
                    <p className="text-gray-300">
                      <strong>Status:</strong> Ready for Kana Labs integration
                    </p>
                  </div>

                  <KanaTest />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
