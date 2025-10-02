import React from "react";
import { FaTrophy, FaEye } from "react-icons/fa";

const RightSidebar: React.FC = () => {
  const topTraders = [
    {
      id: 1,
      name: "CryptoWhale",
      avatar: "🐋",
      pnl: "+$45,678",
      pnlPercent: "+23.4%",
      winRate: "89%",
      followers: "12.5K",
    },
    {
      id: 2,
      name: "DeFiMaster",
      avatar: "🚀",
      pnl: "+$32,456",
      pnlPercent: "+18.7%",
      winRate: "85%",
      followers: "8.9K",
    },
    {
      id: 3,
      name: "AptosPro",
      avatar: "💎",
      pnl: "+$28,901",
      pnlPercent: "+15.2%",
      winRate: "82%",
      followers: "6.7K",
    },
  ];

  return (
    <div className="sticky top-20 space-y-6">
      {/* Top Traders */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center">
          <FaTrophy className="mr-2 text-yellow-500" />
          Top Traders
        </h3>
        <div className="space-y-4">
          {topTraders.map((trader, index) => (
            <div
              key={trader.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{trader.avatar}</span>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">
                      {trader.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {trader.followers} followers
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-600 font-semibold text-sm">
                  {trader.pnl}
                </p>
                <p className="text-gray-500 text-xs">
                  {trader.pnlPercent} • {trader.winRate}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center justify-center space-x-1">
          <span>View All Traders</span>
          <FaEye className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;
