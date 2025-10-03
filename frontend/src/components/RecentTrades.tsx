import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { TradesService, CopyTradingTrade } from "../services/tradesService";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Eye,
} from "lucide-react";

interface RecentTradesProps {
  limit?: number;
  showViewAll?: boolean;
}

const RecentTrades: React.FC<RecentTradesProps> = ({
  limit = 5,
  showViewAll = true,
}) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<CopyTradingTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.aptos_wallet_address) {
      loadTrades();
    }
  }, [user?.aptos_wallet_address]);

  const loadTrades = async () => {
    if (!user?.aptos_wallet_address) return;

    try {
      setLoading(true);
      setError(null);
      const userTrades = await TradesService.getUserTrades(
        user.aptos_wallet_address,
        limit,
        0,
        "SUCCESS" // Only show successful trades
      );
      setTrades(userTrades);
    } catch (err) {
      console.error("Error loading trades:", err);
      setError("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const tradeTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - tradeTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "SELL":
      case "EXIT_LONG":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
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
    if (pnl === undefined || pnl === null) return null;
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

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-semibold text-lg">Recent Trades</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-semibold text-lg">Recent Trades</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-2">Error Loading Trades</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={loadTrades}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 font-semibold text-lg">Recent Trades</h3>
        {showViewAll && trades.length > 0 && (
          <Link
            to="/trades"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <span>View All</span>
            <Eye className="w-4 h-4" />
          </Link>
        )}
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-500 text-lg mb-2">No trades yet</p>
          <p className="text-gray-400 text-sm">
            Your bot trades will appear here once they start executing.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200">
                  {getActionIcon(trade.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-900 font-semibold text-sm">
                      {trade.symbol}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getActionColor(
                        trade.action
                      )}`}
                    >
                      {trade.action}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        trade.status
                      )}`}
                    >
                      {trade.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{formatPrice(trade.price)}</span>
                    <span>•</span>
                    <span>{formatQuantity(trade.quantity)} USDT</span>
                    <span>•</span>
                    <span>{trade.leverage}x</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(trade.created_at)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  {formatPnl(trade.pnl)}
                  <div className="text-xs text-gray-500 mt-1">
                    {trade.order_type}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(trade.status)}
                  {trade.transaction_hash && (
                    <button
                      onClick={() =>
                        window.open(
                          `https://explorer.aptoslabs.com/txn/${trade.transaction_hash}`,
                          "_blank"
                        )
                      }
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTrades;
