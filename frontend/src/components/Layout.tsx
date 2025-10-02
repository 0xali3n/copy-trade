import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleAuthButton from "./GoogleAuthButton";
import BalanceHeader from "./BalanceHeader";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import DepositPopup from "./DepositPopup";

interface LayoutProps {
  children: React.ReactNode;
  showSidebars?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebars = true }) => {
  const { isAuthenticated } = useAuth();
  const [isDepositPopupOpen, setIsDepositPopupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <h1 className="text-gray-900 text-xl font-semibold">
                Kana Copy Trader
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <BalanceHeader
                    onDepositClick={() => setIsDepositPopupOpen(true)}
                  />
                  <GoogleAuthButton />
                </>
              ) : (
                <GoogleAuthButton />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showSidebars ? (
          <div className="grid grid-cols-12 gap-4 min-h-screen py-4">
            {/* Left Sidebar */}
            <div className="col-span-3 xl:col-span-2">
              <LeftSidebar />
            </div>

            {/* Main Content */}
            <div className="col-span-6 xl:col-span-7">
              <main className="min-h-screen">{children}</main>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-3 xl:col-span-3">
              <RightSidebar />
            </div>
          </div>
        ) : (
          <main className="min-h-screen py-4">{children}</main>
        )}
      </div>

      {/* Deposit Popup */}
      <DepositPopup
        isOpen={isDepositPopupOpen}
        onClose={() => setIsDepositPopupOpen(false)}
        onTransferComplete={() => {
          // Refresh balance or show success message
          console.log("Transfer completed successfully");
        }}
      />
    </div>
  );
};

export default Layout;
