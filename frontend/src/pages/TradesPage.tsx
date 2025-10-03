import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  TradesService,
  CopyTradingTrade,
  TradeStats,
} from "../services/tradesService";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Filter,
  RefreshCw,
} from "lucide-react";

const TradesPage: React.FC = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<CopyTradingTrade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "ALL" | "SUCCESS" | "FAILED" | "PENDING"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    if (user?.aptos_wallet_address) {
      loadTrades();
      loadStats();
    }
  }, [user?.aptos_wallet_address, filter, currentPage]);

  const loadTrades = async () => {
    if (!user?.aptos_wallet_address) {
      console.log("❌ No user wallet address found");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const offset = currentPage * itemsPerPage;
      console.log(`🔄 Loading trades for user: ${user.aptos_wallet_address}`);
      const userTrades = await TradesService.getUserTrades(
        user.aptos_wallet_address,
        itemsPerPage,
        offset,
        filter === "ALL"
          ? undefined
          : (filter as "SUCCESS" | "FAILED" | "PENDING")
      );

      if (currentPage === 0) {
        setTrades(userTrades);
      } else {
        setTrades((prev) => [...prev, ...userTrades]);
      }

      setHasMore(userTrades.length === itemsPerPage);
    } catch (err) {
      console.error("Error loading trades:", err);
      setError("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.aptos_wallet_address) return;

    try {
      const userStats = await TradesService.getUserTradeStats(
        user.aptos_wallet_address
      );
      setStats(userStats);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(0);
    setTrades([]);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const refreshTrades = () => {
    setCurrentPage(0);
    setTrades([]);
    loadTrades();
    loadStats();
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "text-green-600 bg-green-50 border-green-200";
      case "FAILED":
        return "text-red-600 bg-red-50 border-red-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BUY":
      case "EXIT_SHORT":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "SELL":
      case "EXIT_LONG":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
      case "EXIT_SHORT":
        return "text-green-600 bg-green-50 border-green-200";
      case "SELL":
      case "EXIT_LONG":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatQuantity = (quantity: number) => {
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)}K`;
    }
    return quantity.toFixed(2);
  };

  const formatPnl = (pnl?: number) => {
    if (pnl === undefined || pnl === null) return "N/A";
    const isPositive = pnl >= 0;
    return (
      <span
        className={`font-semibold ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}${pnl.toFixed(2)}
      </span>
    );
  };

  const filteredTrades = trades.filter(
    (trade) => filter === "ALL" || trade.status === filter
  );

  if (loading && trades.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trades...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && trades.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Trades
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refreshTrades}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Trading History
            </h1>
            <p className="text-gray-600 mt-2">
              View all your copy trading transactions
            </p>
          </div>
          <button
            onClick={refreshTrades}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Trades
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTrades}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total P&L</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stats.totalPnl >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {stats.totalPnl >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTrades > 0
                    ? (
                        (stats.successfulTrades / stats.totalTrades) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700 font-medium">Filter by status:</span>
            <div className="flex space-x-2">
              {(["ALL", "SUCCESS", "FAILED", "PENDING"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredTrades.length} of {trades.length} trades
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trade
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leverage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8">
                        {getActionIcon(trade.action)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {trade.order_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trade.market_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {trade.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getActionColor(
                        trade.action
                      )}`}
                    >
                      {trade.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(trade.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(trade.quantity)} USDT
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trade.leverage}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatPnl(trade.pnl)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(trade.status)}
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          trade.status
                        )}`}
                      >
                        {trade.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(trade.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {trade.transaction_hash && (
                      <button
                        onClick={() =>
                          window.open(
                            `https://explorer.aptoslabs.com/txn/${trade.transaction_hash}`,
                            "_blank"
                          )
                        }
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No trades found
            </h3>
            <p className="text-gray-500">
              {filter === "ALL"
                ? "You haven't made any trades yet. Start copy trading to see your transactions here."
                : `No ${filter.toLowerCase()} trades found.`}
            </p>
          </div>
        )}

        {hasMore && filteredTrades.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More Trades</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradesPage;
