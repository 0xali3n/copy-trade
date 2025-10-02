import React, { useState } from "react";
import { Trophy, Eye, Bot, X } from "lucide-react";

const RightSidebar: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const topTraders = [
    {
      id: 1,
      name: "CryptoWhale",
      avatar: "CW",
      walletAddress: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
      pnl: "+$45,678",
      pnlPercent: "+23.4%",
      winRate: "89%",
      followers: "12.5K",
      totalTrades: 156,
      avgReturn: "+18.2%",
      riskLevel: "Medium",
      joinDate: "2023-01-15",
    },
    {
      id: 2,
      name: "DeFiMaster",
      avatar: "DM",
      walletAddress: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
      pnl: "+$32,456",
      pnlPercent: "+18.7%",
      winRate: "85%",
      followers: "8.9K",
      totalTrades: 134,
      avgReturn: "+15.8%",
      riskLevel: "Low",
      joinDate: "2023-02-20",
    },
    {
      id: 3,
      name: "AptosPro",
      avatar: "AP",
      walletAddress: "0x4d5e6f7890abcdef1234567890abcdef12345678",
      pnl: "+$28,901",
      pnlPercent: "+15.2%",
      winRate: "82%",
      followers: "6.7K",
      totalTrades: 98,
      avgReturn: "+12.4%",
      riskLevel: "High",
      joinDate: "2023-03-10",
    },
    {
      id: 4,
      name: "TradingGuru",
      avatar: "TG",
      walletAddress: "0x5e6f7890abcdef1234567890abcdef1234567890",
      pnl: "+$24,567",
      pnlPercent: "+12.8%",
      winRate: "78%",
      followers: "5.2K",
      totalTrades: 87,
      avgReturn: "+10.6%",
      riskLevel: "Medium",
      joinDate: "2023-04-05",
    },
    {
      id: 5,
      name: "CryptoKing",
      avatar: "CK",
      walletAddress: "0x6f7890abcdef1234567890abcdef1234567890ab",
      pnl: "+$21,234",
      pnlPercent: "+11.5%",
      winRate: "75%",
      followers: "4.8K",
      totalTrades: 76,
      avgReturn: "+9.8%",
      riskLevel: "Low",
      joinDate: "2023-05-12",
    },
  ];

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleCopyBot = (traderName: string) => {
    console.log(`Starting copy bot for ${traderName}`);
    // Here you would implement the copy bot functionality
    handleClosePopup();
  };

  return (
    <div className="sticky top-20 space-y-6">
      {/* Top Traders */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-gray-900 font-semibold text-lg mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" />
          Top Traders
        </h3>
        <div className="space-y-3">
          {topTraders.map((trader, index) => (
            <div
              key={trader.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-gray-900 font-semibold text-sm">
                    {trader.name}
                  </h4>
                  <p className="text-gray-500 text-xs font-mono">
                    {trader.walletAddress.slice(0, 6)}...
                    {trader.walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-600 font-bold text-sm">{trader.pnl}</p>
                <p className="text-gray-500 text-xs">{trader.pnlPercent}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsPopupOpen(true)}
          className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center justify-center space-x-1 py-2 px-4 rounded-lg hover:bg-blue-50"
        >
          <span>View All Traders</span>
          <Eye className="w-3 h-3" />
        </button>
      </div>

      {/* All Traders Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Traders
              </h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* All Traders List */}
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3">
                {topTraders.map((trader, index) => (
                  <div
                    key={trader.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {trader.avatar}
                      </div>
                      <div>
                        <h3 className="text-gray-900 font-medium text-sm">
                          {trader.name}
                        </h3>
                        <p className="text-gray-500 text-xs font-mono mt-0.5">
                          {trader.walletAddress.slice(0, 6)}...
                          {trader.walletAddress.slice(-4)}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-green-600 font-semibold text-xs">
                            {trader.pnl}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {trader.pnlPercent}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {trader.winRate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyBot(trader.name)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1"
                    >
                      <Bot className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
