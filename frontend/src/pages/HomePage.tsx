import React from "react";
import { useAuth } from "../contexts/AuthContext";
import TradingFeed from "../components/TradingFeed";
import MarketData from "../components/MarketData";

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="w-32 h-32 bg-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-white font-bold text-6xl">K</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Kana Copy Trader
            </h1>
            <p className="text-gray-300 text-xl mb-8">
              Professional copy trading for Kana Labs Perpetual Futures.
              Advanced trading tools and strategies for successful trading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Real-time
              </h3>
              <p className="text-gray-300">
                WebSocket-powered instant order detection and execution
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                All Orders
              </h3>
              <p className="text-gray-300">
                Copy all types of orders including market, limit, and stop
                orders
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure</h3>
              <p className="text-gray-300">
                Bank-grade security with encrypted API keys and secure
                authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Market Data Section */}
      <MarketData />

      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome back, {user?.full_name || "Trader"}!
        </h2>
        <p className="text-gray-600 text-lg">
          Here's what's happening in the trading community
        </p>
      </div>

      {/* Trading Feed */}
      <TradingFeed />
    </div>
  );
};

export default HomePage;
