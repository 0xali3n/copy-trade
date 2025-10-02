import React, { useState } from "react";
import {
  FaDollarSign,
  FaRobot,
  FaBullseye,
  FaUsers,
  FaCog,
  FaPlay,
  FaPause,
  FaEye,
  FaTimes,
  FaCopy,
} from "react-icons/fa";

interface TradingBot {
  id: number;
  name: string;
  targetAddress: string;
  status: "active" | "paused";
  pnl: number;
  trades: number;
  winRate: number;
  lastTrade: string;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const [tradingBots, setTradingBots] = useState<TradingBot[]>([]);
  const [isCreateBotOpen, setIsCreateBotOpen] = useState(false);
  const [botName, setBotName] = useState("");
  const [targetAddress, setTargetAddress] = useState("");

  const handleCreateBot = () => {
    if (botName.trim() && targetAddress.trim()) {
      const newBot: TradingBot = {
        id: Date.now(),
        name: botName.trim(),
        targetAddress: targetAddress.trim(),
        status: "active",
        pnl: 0,
        trades: 0,
        winRate: 0,
        lastTrade: "Just started",
        createdAt: new Date().toISOString(),
      };

      setTradingBots([...tradingBots, newBot]);
      setBotName("");
      setTargetAddress("");
      setIsCreateBotOpen(false);
    }
  };

  const toggleBotStatus = (botId: number) => {
    setTradingBots((bots) =>
      bots.map((bot) =>
        bot.id === botId
          ? { ...bot, status: bot.status === "active" ? "paused" : "active" }
          : bot
      )
    );
  };

  const deleteBot = (botId: number) => {
    setTradingBots((bots) => bots.filter((bot) => bot.id !== botId));
  };

  // Calculate totals
  const totalPnl = tradingBots.reduce((sum, bot) => sum + bot.pnl, 0);
  const activeBots = tradingBots.filter(
    (bot) => bot.status === "active"
  ).length;
  const pausedBots = tradingBots.filter(
    (bot) => bot.status === "paused"
  ).length;
  const totalTrades = tradingBots.reduce((sum, bot) => sum + bot.trades, 0);
  const avgWinRate =
    tradingBots.length > 0
      ? Math.round(
          tradingBots.reduce((sum, bot) => sum + bot.winRate, 0) /
            tradingBots.length
        )
      : 0;

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
              <p className="text-gray-900 font-bold text-2xl">
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
              </p>
              <p className="text-gray-500 text-sm">
                Start trading to see profits
              </p>
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
              <p className="text-gray-900 font-bold text-2xl">{activeBots}</p>
              <p className="text-blue-600 text-sm">
                {pausedBots > 0
                  ? `${pausedBots} paused`
                  : "Create your first bot"}
              </p>
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
              <p className="text-gray-900 font-bold text-2xl">{avgWinRate}%</p>
              <p className="text-purple-600 text-sm">
                {totalTrades} trades total
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FaBullseye className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Bots</p>
              <p className="text-gray-900 font-bold text-2xl">
                {tradingBots.length}
              </p>
              <p className="text-orange-600 text-sm">Copy trading bots</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <FaCopy className="text-orange-600 text-xl" />
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
            <button
              onClick={() => setIsCreateBotOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Create Bot
            </button>
          </div>

          {tradingBots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRobot className="text-gray-400 text-2xl" />
              </div>
              <h4 className="text-gray-900 font-semibold text-lg mb-2">
                No bots created yet
              </h4>
              <p className="text-gray-500 mb-6">
                Create your first copy trading bot to start following successful
                traders
              </p>
              <button
                onClick={() => setIsCreateBotOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Create Your First Bot
              </button>
            </div>
          ) : (
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
                      <div>
                        <h4 className="text-gray-900 font-semibold">
                          {bot.name}
                        </h4>
                        <p className="text-gray-500 text-xs font-mono">
                          Target: {bot.targetAddress.slice(0, 8)}...
                          {bot.targetAddress.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => deleteBot(bot.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete bot"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 transition-colors">
                        <FaCog className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleBotStatus(bot.id)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        title={
                          bot.status === "active" ? "Pause bot" : "Resume bot"
                        }
                      >
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
          )}
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

          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBullseye className="text-gray-400 text-2xl" />
            </div>
            <h4 className="text-gray-900 font-semibold text-lg mb-2">
              No trades yet
            </h4>
            <p className="text-gray-500">
              Your bot trades will appear here once they start executing
            </p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 font-semibold text-xl">
              Performance Chart
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
              View Details
            </button>
          </div>

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

      {/* Create Bot Popup */}
      {isCreateBotOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Create Copy Trading Bot
              </h3>
              <button
                onClick={() => setIsCreateBotOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g., Whale Tracker Bot"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Wallet Address
                </label>
                <input
                  type="text"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x1234...5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the wallet address of the trader you want to copy
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsCreateBotOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBot}
                disabled={!botName.trim() || !targetAddress.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Start Bot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
