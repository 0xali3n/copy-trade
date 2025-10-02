import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Image,
  BarChart3,
  MessageCircle,
  Repeat2,
  Heart,
  Bot,
  MoreHorizontal,
  Verified,
  ExternalLink,
  TrendingUp,
  X,
  Plus,
  Vote,
} from "lucide-react";

interface TradeDetails {
  symbol: string;
  leverage: number;
  entryPrice: number;
  quantity: number;
  side: "long" | "short";
  status: "open" | "closed";
  currentPrice?: number;
  closingPrice?: number;
  pnl?: number;
  pnlPercent?: number;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVote?: string;
}

interface TradingPost {
  id: number;
  user: {
    name: string;
    avatar: string; // Can be initials (2 chars) or image URL
    walletAddress: string;
    twitterHandle?: string;
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
  trade?: TradeDetails;
  poll?: Poll;
}

const TradingFeed: React.FC = () => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const [, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [tradeDetails, setTradeDetails] = useState<TradeDetails>({
    symbol: "BTC/USDT",
    leverage: 1,
    entryPrice: 0,
    quantity: 0,
    side: "long",
    status: "open",
    closingPrice: undefined,
  });
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "", votes: 0 },
    { id: "2", text: "", votes: 0 },
  ]);
  const [posts, setPosts] = useState<TradingPost[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<{ [key: string]: number }>(
    {}
  );

  // Fetch real-time crypto prices
  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,aptos&vs_currencies=usd"
      );
      const data = await response.json();

      setCryptoPrices({
        "BTC/USDT": data.bitcoin?.usd || 0,
        "ETH/USDT": data.ethereum?.usd || 0,
        "APT/USDT": data.aptos?.usd || 0,
      });
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      // Fallback prices if API fails
      setCryptoPrices({
        "BTC/USDT": 43250.5,
        "ETH/USDT": 2650.75,
        "APT/USDT": 12.45,
      });
    }
  };

  // Fetch prices on component mount and every 30 seconds
  React.useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const mockPosts: TradingPost[] = [
    {
      id: 1,
      user: {
        name: "CryptoWhale",
        avatar: "CW",
        walletAddress: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
        twitterHandle: "cryptowhale_apt",
        verified: true,
      },
      content:
        "Just opened a long position on APT/USDT at $12.30. Strong support level and bullish momentum. Target: $15.00. Risk management is key!",
      image: "/api/placeholder/400/200",
      timestamp: "2h",
      stats: { likes: 234, retweets: 45, comments: 23 },
      trade: {
        symbol: "APT/USDT",
        side: "long",
        leverage: 5,
        entryPrice: 12.3,
        quantity: 100,
        status: "open",
        currentPrice: 12.45,
        pnl: 75,
        pnlPercent: 1.2,
      },
    },
    {
      id: 2,
      user: {
        name: "DeFiMaster",
        avatar: "DM",
        walletAddress: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
        twitterHandle: "defimaster_trade",
        verified: true,
      },
      content:
        "Market analysis: APT showing strong fundamentals. Volume increasing, RSI oversold. Perfect entry point for swing trade",
      timestamp: "4h",
      stats: { likes: 189, retweets: 32, comments: 18 },
      trade: {
        symbol: "APT/USDT",
        side: "long",
        leverage: 3,
        entryPrice: 11.85,
        quantity: 200,
        status: "open",
        currentPrice: 12.45,
        pnl: 360,
        pnlPercent: 5.1,
      },
    },
    {
      id: 3,
      user: {
        name: "TradingGuru",
        avatar: "TG",
        walletAddress: "0x3c4d5e6f7890abcdef1234567890abcdef123456",
        verified: false,
      },
      content:
        "Short APT at $12.50. Resistance level holding strong. Stop loss at $13.00, target $11.00",
      timestamp: "6h",
      stats: { likes: 156, retweets: 28, comments: 15 },
      poll: {
        id: "poll1",
        question: "Where do you think APT will be by end of week?",
        options: [
          { id: "1", text: "Above $15", votes: 45 },
          { id: "2", text: "$12-15", votes: 32 },
          { id: "3", text: "Below $12", votes: 23 },
        ],
        totalVotes: 100,
      },
    },
    {
      id: 4,
      user: {
        name: "AptosPro",
        avatar: "AP",
        walletAddress: "0x4d5e6f7890abcdef1234567890abcdef12345678",
        twitterHandle: "aptos_pro_trader",
        verified: true,
      },
      content:
        "Screenshot of my trading dashboard. 78% win rate this month! Copy my trades and join the profit train",
      image: "/api/placeholder/400/300",
      timestamp: "8h",
      stats: { likes: 445, retweets: 89, comments: 67 },
      trade: {
        symbol: "APT/USDT",
        side: "long",
        leverage: 10,
        entryPrice: 11.2,
        quantity: 50,
        status: "closed",
        currentPrice: 12.45,
        pnl: 625,
        pnlPercent: 11.2,
      },
    },
  ];

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim() && user) {
      // Create new post with user data
      const newPostData: TradingPost = {
        id: Date.now(), // Simple ID generation
        user: {
          name: user.full_name || "Trader",
          avatar: user.avatar_url || user.email?.charAt(0).toUpperCase() || "T",
          walletAddress:
            user.aptos_wallet_address ||
            "0x0000000000000000000000000000000000000000",
          twitterHandle: user.twitter_username,
          verified: false, // You can add verification logic later
        },
        content: newPost,
        image: imagePreview || undefined,
        timestamp: "now",
        stats: {
          likes: 0,
          retweets: 0,
          comments: 0,
        },
        trade:
          showTradeForm && tradeDetails.entryPrice > 0
            ? {
                ...tradeDetails,
                currentPrice:
                  cryptoPrices[tradeDetails.symbol] || tradeDetails.entryPrice,
                pnl: 0, // Will be calculated based on real price difference
                pnlPercent: 0, // Will be calculated based on real price difference
              }
            : undefined,
        poll:
          showPollForm &&
          pollQuestion.trim() &&
          pollOptions.some((opt) => opt.text.trim())
            ? {
                id: `poll_${Date.now()}`,
                question: pollQuestion,
                options: pollOptions
                  .filter((opt) => opt.text.trim())
                  .map((opt) => ({
                    ...opt,
                    votes: 0, // Start with 0 votes
                  })),
                totalVotes: 0,
              }
            : undefined,
      };

      // Calculate total votes for poll
      if (newPostData.poll) {
        newPostData.poll.totalVotes = newPostData.poll.options.reduce(
          (sum, opt) => sum + opt.votes,
          0
        );
      }

      // Add new post to the beginning of the posts array
      setPosts((prevPosts) => [newPostData, ...prevPosts]);

      // Reset form
      setNewPost("");
      setSelectedImage(null);
      setImagePreview(null);
      setShowTradeForm(false);
      setShowPollForm(false);
      setTradeDetails({
        symbol: "BTC/USDT",
        leverage: 1,
        entryPrice: 0,
        quantity: 0,
        side: "long",
        status: "open",
        closingPrice: undefined,
      });
      setPollQuestion("");
      setPollOptions([
        { id: "1", text: "", votes: 0 },
        { id: "2", text: "", votes: 0 },
      ]);

      console.log("New post created:", newPostData);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const addPollOption = () => {
    const newId = (pollOptions.length + 1).toString();
    setPollOptions([...pollOptions, { id: newId, text: "", votes: 0 }]);
  };

  const removePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((option) => option.id !== id));
    }
  };

  const updatePollOption = (id: string, text: string) => {
    setPollOptions(
      pollOptions.map((option) =>
        option.id === id ? { ...option, text } : option
      )
    );
  };

  // Calculate real P&L based on current market prices or closing price
  const calculateRealPnL = (trade: TradeDetails) => {
    // For closed trades, use closing price if available, otherwise use current market price
    // For open trades, use current market price
    const currentPrice =
      trade.status === "closed" && trade.closingPrice
        ? trade.closingPrice
        : cryptoPrices[trade.symbol] || trade.currentPrice || trade.entryPrice;

    if (!currentPrice || !trade.entryPrice || !trade.quantity) {
      return { pnl: 0, pnlPercent: 0 };
    }

    const priceDiff =
      trade.side === "long"
        ? currentPrice - trade.entryPrice
        : trade.entryPrice - currentPrice;

    // Calculate position size in USDT
    const positionSize = trade.quantity; // This is already in USDT
    const pnl = (priceDiff / trade.entryPrice) * positionSize * trade.leverage;
    const pnlPercent = (priceDiff / trade.entryPrice) * 100 * trade.leverage;

    return { pnl, pnlPercent, currentPrice };
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <form onSubmit={handlePostSubmit}>
            <div className="flex space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your trading insights..."
                  className="w-full bg-transparent text-gray-900 placeholder-gray-500 resize-none focus:outline-none text-lg leading-relaxed"
                  rows={3}
                />
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-w-md rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Trade Form */}
                {showTradeForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Trade Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Symbol
                        </label>
                        <select
                          value={tradeDetails.symbol}
                          onChange={(e) =>
                            setTradeDetails({
                              ...tradeDetails,
                              symbol: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="BTC/USDT">BTC/USDT</option>
                          <option value="ETH/USDT">ETH/USDT</option>
                          <option value="APT/USDT">APT/USDT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={tradeDetails.status}
                          onChange={(e) =>
                            setTradeDetails({
                              ...tradeDetails,
                              status: e.target.value as "open" | "closed",
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Side
                        </label>
                        <select
                          value={tradeDetails.side}
                          onChange={(e) =>
                            setTradeDetails({
                              ...tradeDetails,
                              side: e.target.value as "long" | "short",
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="long">Long</option>
                          <option value="short">Short</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Leverage
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={tradeDetails.leverage}
                          onChange={(e) =>
                            setTradeDetails({
                              ...tradeDetails,
                              leverage: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Entry Price (USDT)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={tradeDetails.entryPrice}
                          onChange={(e) =>
                            setTradeDetails({
                              ...tradeDetails,
                              entryPrice: Number(e.target.value),
                            })
                          }
                          placeholder={
                            cryptoPrices[tradeDetails.symbol]
                              ? `Current: $${cryptoPrices[
                                  tradeDetails.symbol
                                ].toFixed(2)}`
                              : "Enter price"
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {cryptoPrices[tradeDetails.symbol] && (
                          <p className="text-xs text-gray-500 mt-1">
                            Current market price: $
                            {cryptoPrices[tradeDetails.symbol].toFixed(2)}
                          </p>
                        )}
                      </div>
                      {tradeDetails.status === "closed" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Closing Price (USDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={tradeDetails.closingPrice || ""}
                            onChange={(e) =>
                              setTradeDetails({
                                ...tradeDetails,
                                closingPrice: Number(e.target.value),
                              })
                            }
                            placeholder="Enter closing price"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Price at which you closed the trade
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Trade Amount (USDT)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={tradeDetails.quantity}
                          onChange={(e) =>
                            setTradeDetails({
                              ...tradeDetails,
                              quantity: Number(e.target.value),
                            })
                          }
                          placeholder="Enter amount in USDT"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Amount you want to invest in USDT
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Poll Form */}
                {showPollForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Create Poll
                    </h4>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="What's your prediction?"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Options
                      </label>
                      {pollOptions.map((option, index) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) =>
                              updatePollOption(option.id, e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removePollOption(option.id)}
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addPollOption}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors group cursor-pointer">
                      <Image className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTradeForm(!showTradeForm)}
                      className={`flex items-center space-x-2 transition-colors group ${
                        showTradeForm
                          ? "text-blue-600"
                          : "text-gray-400 hover:text-green-500"
                      }`}
                    >
                      <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Trade</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPollForm(!showPollForm)}
                      className={`flex items-center space-x-2 transition-colors group ${
                        showPollForm
                          ? "text-blue-600"
                          : "text-gray-400 hover:text-purple-500"
                      }`}
                    >
                      <Vote className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Poll</span>
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newPost.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
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
      <div className="space-y-4">
        {[...posts, ...mockPosts].map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                    {post.user.avatar && post.user.avatar.length <= 2 ? (
                      <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {post.user.avatar}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={post.user.avatar}
                        alt={post.user.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-gray-900 font-semibold text-base truncate">
                        {post.user.name}
                      </h3>
                      {post.user.verified && (
                        <Verified className="w-4 h-4 text-blue-500" />
                      )}
                      {post.user.twitterHandle && (
                        <a
                          href={`https://twitter.com/${post.user.twitterHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                          title={`View ${post.user.name}'s Twitter`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="truncate font-mono text-xs">
                        {post.user.walletAddress.slice(0, 6)}...
                        {post.user.walletAddress.slice(-4)}
                      </span>
                      <span>·</span>
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-3">
              <p className="text-gray-900 text-base leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="px-4 pb-3">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-8 text-center border border-gray-200">
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">Trading Screenshot</span>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Info */}
            {post.trade && (
              <div className="mx-4 mb-3">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          post.trade.side === "long"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {post.trade.side.toUpperCase()}
                      </span>
                      <span className="text-gray-900 font-semibold text-sm">
                        {post.trade.symbol}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.trade.status === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {post.trade.status.toUpperCase()}
                      </span>
                    </div>
                    {(() => {
                      const realPnL = calculateRealPnL(post.trade);
                      return formatPnl(realPnL.pnl, realPnL.pnlPercent);
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Entry:</span>
                      <span className="text-gray-900 ml-2 font-medium">
                        ${post.trade.entryPrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Leverage:</span>
                      <span className="text-gray-900 ml-2 font-medium">
                        {post.trade.leverage}x
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Invest Amount:</span>
                      <span className="text-gray-900 ml-2 font-medium">
                        ${post.trade.quantity} USDT
                      </span>
                    </div>
                    {(() => {
                      const realPnL = calculateRealPnL(post.trade);
                      return (
                        <div>
                          <span className="text-gray-500">
                            {post.trade.status === "closed"
                              ? "Closing:"
                              : "Current:"}
                          </span>
                          <span className="text-gray-900 ml-2 font-medium">
                            ${realPnL.currentPrice?.toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Poll */}
            {post.poll && (
              <div className="mx-4 mb-3">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-gray-900 font-semibold text-sm mb-3">
                    {post.poll.question}
                  </h4>
                  <div className="space-y-2">
                    {post.poll.options.map((option) => (
                      <div key={option.id} className="relative">
                        <button className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 text-sm">
                              {option.text}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {post.poll && post.poll.totalVotes > 0
                                ? Math.round(
                                    (option.votes / post.poll.totalVotes) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="mt-2 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width:
                                  post.poll && post.poll.totalVotes > 0
                                    ? `${
                                        (option.votes / post.poll.totalVotes) *
                                        100
                                      }%`
                                    : "0%",
                              }}
                            />
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    {post.poll.totalVotes} votes
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                {/* Social Actions */}
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors group">
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">
                      {post.stats.comments}
                    </span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors group">
                    <Repeat2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">
                      {post.stats.retweets}
                    </span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors group">
                    <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">
                      {post.stats.likes}
                    </span>
                  </button>
                </div>

                {/* Trading Actions */}
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg hover:shadow-xl">
                    <Bot className="w-4 h-4" />
                    <span>Start Copy Bot</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradingFeed;
