import React from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleAuthButton from "./GoogleAuthButton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-white font-bold text-4xl">🔒</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sign In Required
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Please sign in to access this page and manage your trading
              account.
            </p>
          </div>

          <div className="flex justify-center">
            <GoogleAuthButton />
          </div>

          <p className="text-gray-500 text-sm mt-6">
            Don't have an account? Sign in with Google to get started.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
