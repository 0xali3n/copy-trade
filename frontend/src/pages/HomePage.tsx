import React from "react";
import { useAuth } from "../contexts/AuthContext";
import TradingFeed from "../components/TradingFeed";
import MarketData from "../components/MarketData";
import {
  Zap,
  BarChart3,
  Shield,
  TrendingUp,
  Users,
  Target,
} from "lucide-react";

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
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4 mx-auto shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Real-time
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                WebSocket-powered instant order detection and execution
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4 mx-auto shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                All Orders
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Copy all types of orders including market, limit, and stop
                orders
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
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
    <div className="space-y-8">
      {/* Market Data Section */}
      <MarketData />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name || "Trader"}!
            </h2>
            <p className="text-gray-600 text-lg">
              Here's what's happening in the trading community
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Trades</p>
                <p className="text-lg font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Following</p>
                <p className="text-lg font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-lg font-semibold text-gray-900">78%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Feed */}
      <TradingFeed />
    </div>
  );
};

export default HomePage;
