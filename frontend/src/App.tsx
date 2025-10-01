import React from "react";
import { useAuth } from "./contexts/AuthContext";
import GoogleAuthButton from "./components/GoogleAuthButton";
import LoadingSpinner from "./components/LoadingSpinner";
import KanaTest from "./components/KanaTest";
import AuthDebug from "./components/AuthDebug";

const App: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <h1 className="text-white text-xl font-bold">Kana Copy Trader</h1>
            </div>
            <GoogleAuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        ) : !isAuthenticated ? (
          // Landing Page
          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="w-32 h-32 bg-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white font-bold text-6xl">K</span>
                </div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  Kana Copy Trader
                </h1>
                <p className="text-gray-300 text-xl mb-8">
                  Professional copy trading for Kana Labs Perpetual Futures.
                  Advanced trading tools and strategies for successful trading.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Real-time
                  </h3>
                  <p className="text-gray-300">
                    WebSocket-powered instant order detection and execution
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    All Orders
                  </h3>
                  <p className="text-gray-300">
                    Copy all types of orders including market, limit, and stop
                    orders
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Secure
                  </h3>
                  <p className="text-gray-300">
                    Bank-grade security with encrypted API keys and secure
                    authentication
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back!
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Welcome, {user?.full_name || user?.email}! Your account is ready
                for Kana Labs integration.
              </p>

              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Active Account
                  </h3>
                  <p className="text-gray-300 mb-2">
                    <strong>Email:</strong> {user?.email}
                  </p>
                  <p className="text-gray-300 mb-2">
                    <strong>Active Account:</strong>{" "}
                    {user?.aptos_public_key || "Not created yet"}
                  </p>
                  <p className="text-gray-300">
                    <strong>Status:</strong>{" "}
                    {user?.aptos_public_key
                      ? "Ready for Kana Labs integration"
                      : "Create active account to start trading"}
                  </p>
                </div>

                <KanaTest />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Debug Component */}
      <AuthDebug />
    </div>
  );
};

export default App;
