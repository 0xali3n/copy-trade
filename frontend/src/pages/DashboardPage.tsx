import React, { useState, useEffect } from "react";
import {
  FaRobot,
  FaEye,
  FaTimes,
  FaCopy,
  FaBullseye,
  FaPlay,
  FaPause,
} from "react-icons/fa";
import {
  simpleBotService,
  SimpleBot,
  CreateBotData,
} from "../services/simpleBotService";

const DashboardPage: React.FC = () => {
  const [tradingBots, setTradingBots] = useState<SimpleBot[]>([]);
  const [isCreateBotOpen, setIsCreateBotOpen] = useState(false);
  const [botName, setBotName] = useState("");
  const [targetAddress, setTargetAddress] = useState("");
  const [botStatus, setBotStatus] = useState<"active" | "paused">("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bots from database on component mount
  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      const bots = await simpleBotService.getUserBots();
      setTradingBots(bots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bots");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    if (targetAddress.trim()) {
      try {
        setLoading(true);
        const botData: CreateBotData = {
          target_address: targetAddress.trim(),
          bot_name: botName.trim() || undefined,
          status: botStatus,
        };

        const newBot = await simpleBotService.createBot(botData);
        setTradingBots([newBot, ...tradingBots]);
        setBotName("");
        setTargetAddress("");
        setBotStatus("active");
        setIsCreateBotOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create bot");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleBotStatus = async (botId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      const updatedBot = await simpleBotService.updateBot(botId, {
        status: newStatus,
      });

      setTradingBots((prevBots) =>
        prevBots.map((bot) => (bot.id === botId ? updatedBot : bot))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update bot status"
      );
    }
  };

  const deleteBot = async (botId: string) => {
    try {
      await simpleBotService.deleteBot(botId);
      setTradingBots((bots) => bots.filter((bot) => bot.id !== botId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bot");
    }
  };

  // Calculate totals (real data only)
  const totalBots = tradingBots.length;
  const activeBots = tradingBots.filter(
    (bot) => bot.status === "active"
  ).length;
  const pausedBots = tradingBots.filter(
    (bot) => bot.status === "paused"
  ).length;

  if (loading && tradingBots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trading bots...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Profit</p>
              <p className="text-gray-900 font-bold text-2xl">$0.00</p>
              <p className="text-gray-500 text-sm">
                {activeBots === 0
                  ? "Start trading to see profits"
                  : "From active bots"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FaBullseye className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Bots Running
              </p>
              <p className="text-gray-900 font-bold text-2xl">{activeBots}</p>
              <p className="text-blue-600 text-sm">
                {activeBots === 0 ? "No bots running" : "Currently trading"}
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
              <p className="text-gray-600 text-sm font-medium">Total Trades</p>
              <p className="text-gray-900 font-bold text-2xl">0</p>
              <p className="text-purple-600 text-sm">
                {activeBots === 0 ? "No trades yet" : "From active bots"}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FaCopy className="text-purple-600 text-xl" />
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          bot.status === "active"
                            ? "bg-green-400"
                            : bot.status === "paused"
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                      ></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-gray-900 font-semibold">
                            {bot.bot_name || `Bot #${bot.id.slice(0, 8)}`}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              bot.status === "active"
                                ? "bg-green-100 text-green-800"
                                : bot.status === "paused"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {bot.status.charAt(0).toUpperCase() +
                              bot.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs font-mono">
                          User: {bot.user_address.slice(0, 8)}...
                          {bot.user_address.slice(-6)}
                        </p>
                        <p className="text-gray-500 text-xs font-mono">
                          Target: {bot.target_address.slice(0, 8)}...
                          {bot.target_address.slice(-6)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Created:{" "}
                          {new Date(bot.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleBotStatus(bot.id, bot.status)}
                        className={`p-2 rounded-lg transition-colors ${
                          bot.status === "active"
                            ? "text-yellow-600 hover:bg-yellow-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                        title={
                          bot.status === "active" ? "Pause Bot" : "Resume Bot"
                        }
                      >
                        {bot.status === "active" ? (
                          <FaPause className="w-4 h-4" />
                        ) : (
                          <FaPlay className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteBot(bot.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title="Delete bot"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
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
                <p className="text-xs text-gray-500 mt-1">
                  Give your bot a memorable name (optional)
                </p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Status
                </label>
                <select
                  value={botStatus}
                  onChange={(e) =>
                    setBotStatus(e.target.value as "active" | "paused")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">
                    Active (Start trading immediately)
                  </option>
                  <option value="paused">
                    Paused (Create but don't start trading)
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose whether to start trading immediately or create in
                  paused state
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
                disabled={!targetAddress.trim() || loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                {loading ? "Creating..." : "Create Bot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
