import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PostsService, Post, CreatePostData } from "../services/postsService";
import { supabase } from "../lib/supabase";
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
  id: string;
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
  isLiked?: boolean; // Track if current user has liked this post
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<{ [key: string]: number }>(
    {}
  );

  // Fetch real-time crypto prices (with rate limiting)
  const fetchCryptoPrices = async () => {
    try {
      // Only fetch if we don't have prices or it's been more than 30 seconds
      const lastFetch = localStorage.getItem("cryptoPricesLastFetch");
      const now = Date.now();

      if (lastFetch && now - parseInt(lastFetch) < 30000) {
        // Use cached prices if less than 30 seconds old
        const cachedPrices = localStorage.getItem("cryptoPrices");
        if (cachedPrices) {
          setCryptoPrices(JSON.parse(cachedPrices));
          return;
        }
      }

      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,aptos&vs_currencies=usd"
      );
      const data = await response.json();

      const prices = {
        "BTC/USDT": data.bitcoin?.usd || 43250.5,
        "ETH/USDT": data.ethereum?.usd || 2650.75,
        "APT/USDT": data.aptos?.usd || 12.45,
      };

      setCryptoPrices(prices);

      // Cache the prices
      localStorage.setItem("cryptoPrices", JSON.stringify(prices));
      localStorage.setItem("cryptoPricesLastFetch", now.toString());
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      // Fallback prices if API fails
      const fallbackPrices = {
        "BTC/USDT": 43250.5,
        "ETH/USDT": 2650.75,
        "APT/USDT": 12.45,
      };
      setCryptoPrices(fallbackPrices);
    }
  };

  // Load posts from database
  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading posts from database...");

      const dbPosts = await PostsService.getPosts();
      console.log(
        "✅ Database connected! Posts fetched:",
        dbPosts.length,
        "posts"
      );
      console.log("📊 Posts data:", dbPosts);
      console.log("👤 Current user data:", user);

      // Convert database posts to TradingPost format
      const formattedPosts: TradingPost[] = dbPosts.map((post: Post) => {
        console.log(`📝 Processing post ${post.id}:`, {
          postUserId: post.user_id,
          postUserData: post.users,
          currentUserId: user?.id,
          fullPostData: post, // Log the entire post to see what we're getting
        });

        return {
          id: post.id,
          user: {
            name:
              post.users?.full_name ||
              (post.user_id === user?.id ? user?.full_name : null) ||
              "Anonymous",
            avatar:
              post.users?.avatar_url ||
              (post.user_id === user?.id ? user?.avatar_url : null) ||
              post.users?.full_name?.charAt(0).toUpperCase() ||
              (post.user_id === user?.id
                ? user?.full_name?.charAt(0).toUpperCase()
                : null) ||
              "A",
            walletAddress:
              post.users?.aptos_wallet_address ||
              (post.user_id === user?.id ? user?.aptos_wallet_address : null) ||
              "0x0000000000000000000000000000000000000000",
            twitterHandle:
              post.users?.twitter_username ||
              (post.user_id === user?.id ? user?.twitter_username : undefined),
            verified: false, // You can add verification logic later
          },
          content: post.content,
          image: post.image_url,
          timestamp: formatTimestamp(post.created_at),
          stats: {
            likes: 0,
            retweets: 0,
            comments: 0,
          },
          trade:
            post.post_type === "trade"
              ? {
                  symbol: post.trade_symbol || "BTC/USDT",
                  side: post.trade_side || "long",
                  leverage: post.trade_leverage || 1,
                  entryPrice: post.trade_entry_price || 0,
                  quantity: post.trade_quantity || 0,
                  status: post.trade_status || "open",
                  closingPrice: post.trade_closing_price,
                }
              : undefined,
          poll:
            post.post_type === "poll" && post.poll_question
              ? {
                  id: post.id,
                  question: post.poll_question,
                  options: post.poll_options || [],
                  totalVotes: post.poll_total_votes || 0,
                }
              : undefined,
          isLiked: false, // Will be updated when we check user likes
        };
      });

      setPosts(formattedPosts);
      console.log(
        "✅ Posts loaded successfully:",
        formattedPosts.length,
        "posts"
      );
    } catch (error) {
      console.error("❌ Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - postTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Fetch prices on component mount and every 30 seconds
  React.useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 60000); // Update every 60 seconds to reduce API calls
    return () => clearInterval(interval);
  }, []);

  // Test database connection and load posts on component mount
  React.useEffect(() => {
    const testDatabaseConnection = async () => {
      try {
        console.log("🔌 Testing database connection...");
        const { error } = await supabase.from("posts").select("count").limit(1);
        if (error) {
          console.error("❌ Database connection failed:", error);
        } else {
          console.log("✅ Database connection successful!");
        }
      } catch (error) {
        console.error("❌ Database connection test failed:", error);
      }
    };

    testDatabaseConnection();
    loadPosts();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim() && user && !submitting) {
      try {
        setSubmitting(true);

        // Determine post type
        let postType: "text" | "image" | "trade" | "poll" = "text";
        if (imagePreview) postType = "image";
        else if (showTradeForm && tradeDetails.entryPrice > 0)
          postType = "trade";
        else if (
          showPollForm &&
          pollQuestion.trim() &&
          pollOptions.some((opt) => opt.text.trim())
        )
          postType = "poll";

        // Prepare post data for database
        const postData: CreatePostData = {
          content: newPost,
          image_url: imagePreview || undefined,
          post_type: postType,
        };

        // Add trade data if it's a trade post
        if (postType === "trade") {
          postData.trade_symbol = tradeDetails.symbol;
          postData.trade_side = tradeDetails.side;
          postData.trade_leverage = tradeDetails.leverage;
          postData.trade_entry_price = tradeDetails.entryPrice;
          postData.trade_quantity = tradeDetails.quantity;
          postData.trade_status = tradeDetails.status;
          postData.trade_closing_price = tradeDetails.closingPrice;
        }

        // Add poll data if it's a poll post
        if (postType === "poll") {
          postData.poll_question = pollQuestion;
          postData.poll_options = pollOptions
            .filter((opt) => opt.text.trim())
            .map((opt) => ({
              ...opt,
              votes: 0, // Start with 0 votes
            }));
          postData.poll_total_votes = 0;
        }

        // Save to database
        console.log("💾 Saving post to database:", postData);
        const savedPost = await PostsService.createPost(postData);
        console.log("✅ Post saved successfully to database:", savedPost);
        console.log("🔍 Saved post user data:", savedPost.users);
        console.log("🔍 Current user context:", user);

        // Convert to TradingPost format and add to local state
        const newPostData: TradingPost = {
          id: savedPost.id,
          user: {
            name: savedPost.users?.full_name || user?.full_name || "Anonymous",
            avatar:
              savedPost.users?.avatar_url ||
              user?.avatar_url ||
              savedPost.users?.full_name?.charAt(0).toUpperCase() ||
              user?.full_name?.charAt(0).toUpperCase() ||
              "A",
            walletAddress:
              savedPost.users?.aptos_wallet_address ||
              user?.aptos_wallet_address ||
              "0x0000000000000000000000000000000000000000",
            twitterHandle:
              savedPost.users?.twitter_username || user?.twitter_username,
            verified: false,
          },
          content: savedPost.content,
          image: savedPost.image_url,
          timestamp: "now",
          stats: {
            likes: 0,
            retweets: 0,
            comments: 0,
          },
          trade:
            savedPost.post_type === "trade"
              ? {
                  symbol: savedPost.trade_symbol || "BTC/USDT",
                  side: savedPost.trade_side || "long",
                  leverage: savedPost.trade_leverage || 1,
                  entryPrice: savedPost.trade_entry_price || 0,
                  quantity: savedPost.trade_quantity || 0,
                  status: savedPost.trade_status || "open",
                  closingPrice: savedPost.trade_closing_price,
                }
              : undefined,
          poll:
            savedPost.post_type === "poll" && savedPost.poll_question
              ? {
                  id: savedPost.id,
                  question: savedPost.poll_question,
                  options: savedPost.poll_options || [],
                  totalVotes: savedPost.poll_total_votes || 0,
                }
              : undefined,
          isLiked: false,
        };

        // Add new post to the beginning of the posts array
        setPosts((prevPosts) => [newPostData, ...prevPosts]);
        console.log("✅ Post added to UI successfully");

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

        console.log("🎉 New post saved to database:", savedPost);
      } catch (error) {
        console.error("❌ Error creating post:", error);
        // You could add a toast notification here
      } finally {
        setSubmitting(false);
      }
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

  // Simple like functionality (just for UI, no database)
  const handleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              stats: {
                ...post.stats,
                likes: post.isLiked
                  ? post.stats.likes - 1
                  : post.stats.likes + 1,
              },
            }
          : post
      )
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
                    disabled={!newPost.trim() || submitting}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    {submitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>{submitting ? "Posting..." : "Post"}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Trading Posts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">No posts yet</div>
            <div className="text-gray-400 text-sm">
              Be the first to share your trading insights!
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                      {post.user.avatar && post.user.avatar.length > 2 ? (
                        <img
                          src={post.user.avatar}
                          alt={post.user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails
                            e.currentTarget.style.display = "none";
                            const nextElement = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center ${
                          post.user.avatar && post.user.avatar.length > 2
                            ? "hidden"
                            : ""
                        }`}
                      >
                        <span className="text-white font-bold text-lg">
                          {post.user.avatar && post.user.avatar.length <= 2
                            ? post.user.avatar
                            : post.user.name?.charAt(0).toUpperCase() || "A"}
                        </span>
                      </div>
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
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={post.image}
                      alt="Post image"
                      className="w-full h-auto max-h-96 object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = "block";
                        }
                      }}
                    />
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-8 text-center hidden">
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <BarChart3 className="w-5 h-5" />
                        <span className="font-medium">Trading Screenshot</span>
                      </div>
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
                                      (option.votes / post.poll.totalVotes) *
                                        100
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
                                          (option.votes /
                                            post.poll.totalVotes) *
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
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors group ${
                        post.isLiked
                          ? "text-red-500"
                          : "text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                          post.isLiked ? "fill-current" : ""
                        }`}
                      />
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
          ))
        )}
      </div>
    </div>
  );
};

export default TradingFeed;
