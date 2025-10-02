import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MarketDataItem {
  symbol: string;
  price: number;
  changePercent: number;
}

const MarketData: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([
    {
      symbol: "BTC",
      price: 43250.5,
      changePercent: 0,
    },
    {
      symbol: "ETH",
      price: 2650.75,
      changePercent: 0,
    },
    {
      symbol: "APT",
      price: 12.45,
      changePercent: 0,
    },
  ]);

  // Fetch real-time crypto prices with 24h change
  const fetchMarketData = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,aptos&vs_currencies=usd&include_24hr_change=true"
      );
      const data = await response.json();

      setMarketData([
        {
          symbol: "BTC",
          price: data.bitcoin?.usd || 43250.5,
          changePercent: data.bitcoin?.usd_24h_change || 0,
        },
        {
          symbol: "ETH",
          price: data.ethereum?.usd || 2650.75,
          changePercent: data.ethereum?.usd_24h_change || 0,
        },
        {
          symbol: "APT",
          price: data.aptos?.usd || 12.45,
          changePercent: data.aptos?.usd_24h_change || 0,
        },
      ]);
    } catch (error) {
      console.error("Error fetching market data:", error);
      // Keep fallback prices if API fails
    }
  };

  // Fetch prices on component mount and every 30 seconds
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatChangePercent = (percent: number) => {
    const isPositive = percent >= 0;
    return (
      <div
        className={`flex items-center space-x-1 ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        <span className="text-sm font-medium">
          {isPositive ? "+" : ""}
          {percent.toFixed(2)}%
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center justify-between">
        {marketData.map((coin, index) => (
          <div key={coin.symbol} className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {coin.symbol}
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {formatPrice(coin.price)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Live Price</div>
            </div>
            <div className="flex items-center">
              {formatChangePercent(coin.changePercent)}
            </div>
            {index < marketData.length - 1 && (
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-6"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketData;
