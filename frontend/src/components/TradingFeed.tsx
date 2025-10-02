import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  FaImage,
  FaChartBar,
  FaPen,
  FaComment,
  FaRetweet,
  FaHeart,
  FaChartLine,
} from "react-icons/fa";

interface TradingPost {
  id: number;
  user: {
    name: string;
    avatar: string;
    handle: string;
    verified: boolean;
  };
  content: string;
  image?: string;
  timestamp: string;
  stats: {
    likes: number;
    retweets: number;
    comments: number;
  };
  trade?: {
    symbol: string;
    side: "long" | "short";
    entry: number;
    current: number;
    pnl: number;
    pnlPercent: number;
  };
}

const TradingFeed: React.FC = () => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState("");

  const mockPosts: TradingPost[] = [
    {
      id: 1,
      user: {
        name: "CryptoWhale",
        avatar: "🐋",
        handle: "@cryptowhale",
        verified: true,
      },
      content:
        "Just opened a long position on APT/USDT at $12.30. Strong support level and bullish momentum. Target: $15.00 🚀",
      image: "/api/placeholder/400/200",
      timestamp: "2h",
      stats: { likes: 234, retweets: 45, comments: 23 },
      trade: {
        symbol: "APT/USDT",
        side: "long",
        entry: 12.3,
        current: 12.45,
        pnl: 150,
        pnlPercent: 1.2,
      },
    },
    {
      id: 2,
      user: {
        name: "DeFiMaster",
        avatar: "🚀",
        handle: "@defimaster",
        verified: true,
      },
      content:
        "Market analysis: APT showing strong fundamentals. Volume increasing, RSI oversold. Perfect entry point for swing trade 📊",
      timestamp: "4h",
      stats: { likes: 189, retweets: 32, comments: 18 },
      trade: {
        symbol: "APT/USDT",
        side: "long",
        entry: 11.85,
        current: 12.45,
        pnl: 600,
        pnlPercent: 5.1,
      },
    },
    {
      id: 3,
      user: {
        name: "TradingGuru",
        avatar: "🎯",
        handle: "@tradingguru",
        verified: false,
      },
      content:
        "Short APT at $12.50. Resistance level holding strong. Stop loss at $13.00, target $11.00 ⚡",
      timestamp: "6h",
      stats: { likes: 156, retweets: 28, comments: 15 },
      trade: {
        symbol: "APT/USDT",
        side: "short",
        entry: 12.5,
        current: 12.45,
        pnl: 50,
        pnlPercent: 0.4,
      },
    },
    {
      id: 4,
      user: {
        name: "AptosPro",
        avatar: "💎",
        handle: "@aptospro",
        verified: true,
      },
      content:
        "Screenshot of my trading dashboard. 78% win rate this month! Copy my trades and join the profit train 🚂",
      image: "/api/placeholder/400/300",
      timestamp: "8h",
      stats: { likes: 445, retweets: 89, comments: 67 },
      trade: {
        symbol: "APT/USDT",
        side: "long",
        entry: 11.2,
        current: 12.45,
        pnl: 1250,
        pnlPercent: 11.2,
      },
    },
  ];

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      // Handle post submission
      console.log("New post:", newPost);
      setNewPost("");
    }
  };

  const formatPnl = (pnl: number, pnlPercent: number) => {
    const isPositive = pnl >= 0;
    return (
      <span
        className={`font-semibold ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        {isPositive ? "+" : ""}${pnl.toFixed(2)} ({isPositive ? "+" : ""}
        {pnlPercent.toFixed(1)}%)
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Post Composer */}
      {user && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <form onSubmit={handlePostSubmit}>
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your trading insights..."
                  className="w-full bg-transparent text-gray-900 placeholder-gray-500 resize-none focus:outline-none text-lg"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <FaImage className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <FaChartBar className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <FaPen className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newPost.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Trading Posts Feed */}
      <div className="space-y-6">
        {mockPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6 hover:bg-white transition-colors"
          >
            {/* Post Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {post.user.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-gray-900 font-semibold">
                    {post.user.name}
                  </h3>
                  {post.user.verified && (
                    <span className="text-blue-600">✓</span>
                  )}
                  <span className="text-gray-500 text-sm">
                    {post.user.handle}
                  </span>
                  <span className="text-gray-400 text-sm">·</span>
                  <span className="text-gray-400 text-sm">
                    {post.timestamp}
                  </span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-gray-900 text-lg leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Trade Info */}
            {post.trade && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        post.trade.side === "long"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {post.trade.side.toUpperCase()}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {post.trade.symbol}
                    </span>
                  </div>
                  {formatPnl(post.trade.pnl, post.trade.pnlPercent)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Entry:</span>
                    <span className="text-gray-900 ml-2">
                      ${post.trade.entry}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current:</span>
                    <span className="text-gray-900 ml-2">
                      ${post.trade.current}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Post Image */}
            {post.image && (
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                  <span className="text-gray-500">📊 Trading Screenshot</span>
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                <FaComment className="w-4 h-4" />
                <span className="text-sm">{post.stats.comments}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors">
                <FaRetweet className="w-4 h-4" />
                <span className="text-sm">{post.stats.retweets}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                <FaHeart className="w-4 h-4" />
                <span className="text-sm">{post.stats.likes}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                <FaChartLine className="w-4 h-4" />
                <span className="text-sm">Copy</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradingFeed;
