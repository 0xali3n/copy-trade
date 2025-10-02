import React from "react";

interface MarketDataItem {
  symbol: string;
  price: number;
  changePercent: number;
}

const MarketData: React.FC = () => {
  const marketData: MarketDataItem[] = [
    {
      symbol: "BTC",
      price: 43250.5,
      changePercent: 2.98,
    },
    {
      symbol: "ETH",
      price: 2650.75,
      changePercent: -1.68,
    },
    {
      symbol: "APT",
      price: 12.45,
      changePercent: 7.33,
    },
  ];

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
      <span
        className={`text-sm font-medium ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {percent.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        {marketData.map((coin, index) => (
          <div key={coin.symbol} className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600">
                {coin.symbol}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(coin.price)}
              </div>
            </div>
            <div className="text-right">
              {formatChangePercent(coin.changePercent)}
            </div>
            {index < marketData.length - 1 && (
              <div className="w-px h-8 bg-gray-200 mx-4"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketData;
