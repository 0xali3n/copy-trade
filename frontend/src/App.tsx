// src/App.tsx
import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import WalletConnection from "./components/WalletConnection";

const App: React.FC = () => {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.MAINNET,
      }}
      onError={(error) => {
        console.error("Wallet Adapter Error:", error);
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Wallet Connection - Top Right */}
        <WalletConnection />

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-4xl mx-auto">
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
              Professional copy trading for Kana Labs Perpetual Futures. Connect
              your wallet to start replicating successful traders' strategies.
            </p>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real-time</h3>
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
                  Supports all 12 order types including Market, Limit, and Stop
                  orders
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

            {/* CTA */}
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Connect your wallet in the top right corner to get started
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>Supported wallets:</span>
                <span className="text-blue-400">Petra</span>
                <span>•</span>
                <span className="text-blue-400">OKX</span>
                <span>•</span>
                <span className="text-blue-400">Martian</span>
                <span>•</span>
                <span className="text-blue-400">Pontem</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AptosWalletAdapterProvider>
  );
};

export default App;
