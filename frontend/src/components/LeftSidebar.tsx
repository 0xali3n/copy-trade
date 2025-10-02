import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaHome, FaChartBar, FaCog, FaHistory } from "react-icons/fa";

const LeftSidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const navigationItems = isAuthenticated
    ? [
        { name: "Home", path: "/", icon: FaHome },
        { name: "Dashboard", path: "/dashboard", icon: FaChartBar },
        { name: "Trades", path: "/trades", icon: FaHistory },
        { name: "Settings", path: "/settings", icon: FaCog },
      ]
    : [
        { name: "Home", path: "/", icon: FaHome },
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: FaChartBar,
          requiresAuth: true,
        },
        {
          name: "Trades",
          path: "/trades",
          icon: FaHistory,
          requiresAuth: true,
        },
        {
          name: "Settings",
          path: "/settings",
          icon: FaCog,
          requiresAuth: true,
        },
      ];

  return (
    <div className="sticky top-20 h-fit">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
        {/* User Profile */}
        {isAuthenticated && user && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.email}
                  className="w-12 h-12 rounded-full border border-gray-300 object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-gray-900 font-semibold text-sm truncate">
                  {user.full_name || "Trader"}
                </h3>
                <p
                  className="text-gray-500 text-xs truncate"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isAuthRequired = !isAuthenticated && item.requiresAuth;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 border border-blue-200 text-blue-700"
                    : isAuthRequired
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                title={isAuthRequired ? "Sign in required" : ""}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {isAuthRequired && (
                  <span className="text-xs text-gray-400 ml-auto">🔒</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default LeftSidebar;
