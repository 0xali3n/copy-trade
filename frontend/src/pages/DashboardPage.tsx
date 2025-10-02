import React from "react";
import {
  FaDollarSign,
  FaRobot,
  FaBullseye,
  FaUsers,
  FaCog,
  FaPlay,
  FaPause,
  FaEye,
} from "react-icons/fa";

const DashboardPage: React.FC = () => {
  const tradingBots = [
    {
      id: 1,
      name: "APT Scalper Bot",
      status: "active",
      pnl: 1250.5,
      pnlPercent: 12.5,
      trades: 45,
      winRate: 78,
      lastTrade: "2 min ago",
    },
    {
      id: 2,
      name: "Swing Trader Pro",
      status: "active",
      pnl: 890.25,
      pnlPercent: 8.9,
      trades: 23,
      winRate: 82,
      lastTrade: "15 min ago",
    },
    {
      id: 3,
      name: "Copy Trading Bot",
      status: "paused",
      pnl: -150.75,
      pnlPercent: -1.5,
      trades: 12,
      winRate: 67,
      lastTrade: "1 hour ago",
    },
  ];

  const recentTrades = [
    {
      id: 1,
      symbol: "APT/USDT",
      side: "long",
      entry: 12.3,
      exit: 12.45,
      amount: 100,
      pnl: 15.0,
      timestamp: "2 min ago",
    },
    {
      id: 2,
      symbol: "APT/USDT",
      side: "short",
      entry: 12.5,
      exit: 12.35,
      amount: 50,
      pnl: 7.5,
      timestamp: "15 min ago",
    },
    {
      id: 3,
      symbol: "APT/USDT",
      side: "long",
      entry: 11.85,
      exit: 12.2,
      amount: 200,
      pnl: 70.0,
      timestamp: "1 hour ago",
    },
  ];

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Trading Dashboard
        </h2>
        <p className="text-gray-600 text-lg">
          Monitor your bots, analyze performance, and manage your trades
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total P&L</p>
              <p className="text-gray-900 font-bold text-2xl">+$1,989.75</p>
              <p className="text-green-600 text-sm">+19.9% this month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Bots</p>
              <p className="text-gray-900 font-bold text-2xl">2</p>
              <p className="text-blue-600 text-sm">1 paused</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FaRobot className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Win Rate</p>
              <p className="text-gray-900 font-bold text-2xl">76%</p>
              <p className="text-purple-600 text-sm">80 trades total</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FaBullseye className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Followers</p>
              <p className="text-gray-900 font-bold text-2xl">1,234</p>
              <p className="text-orange-600 text-sm">+45 this week</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <FaUsers className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Trading Bots */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 font-semibold text-xl">
              Trading Bots
            </h3>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">
              Create Bot
            </button>
          </div>

          <div className="space-y-4">
            {tradingBots.map((bot) => (
              <div
                key={bot.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        bot.status === "active"
                          ? "bg-green-400"
                          : "bg-yellow-400"
                      }`}
                    ></div>
                    <h4 className="text-gray-900 font-semibold">{bot.name}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-500 hover:text-gray-700 transition-colors">
                      <FaCog className="w-4 h-4" />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 transition-colors">
                      {bot.status === "active" ? (
                        <FaPause className="w-4 h-4" />
                      ) : (
                        <FaPlay className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="truncate">
                    <span className="text-gray-500">P&L:</span>
                    <span
                      className={`ml-1 font-semibold ${
                        bot.pnl >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {bot.pnl >= 0 ? "+" : ""}${bot.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Trades:</span>
                    <span className="text-gray-900 ml-1 font-semibold">
                      {bot.trades}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Win Rate:</span>
                    <span className="text-blue-600 ml-1 font-semibold">
                      {bot.winRate}%
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Last:</span>
                    <span className="text-gray-600 ml-1 text-xs">
                      {bot.lastTrade}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 font-semibold text-xl">
              Recent Trades
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center space-x-1">
              <span>View All</span>
              <FaEye className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.side === "long"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {trade.side.toUpperCase()}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {trade.symbol}
                    </span>
                  </div>
                  <span
                    className={`font-semibold ${
                      trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="truncate">
                    <span className="text-gray-500">Entry:</span>
                    <span className="text-gray-900 ml-1">${trade.entry}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Exit:</span>
                    <span className="text-gray-900 ml-1">${trade.exit}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Amount:</span>
                    <span className="text-gray-900 ml-1">${trade.amount}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {trade.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-gray-900 font-semibold text-xl mb-6">
          Performance Chart
        </h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
          <div className="text-center">
            <span className="text-gray-400 text-4xl mb-2 block">📊</span>
            <p className="text-gray-500">
              Performance chart will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
