import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const GoogleAuthButton: React.FC = () => {
  const { user, isAuthenticated, isLoading, signInWithGoogle, signOut } =
    useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in failed:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error("Sign-out failed:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-white text-sm font-medium">Loading...</span>
      </div>
    );
  }

  // Show user profile when authenticated
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3">
        {/* User Avatar and Info */}
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || user.email}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <span className="text-white text-sm font-medium">
            {user.full_name || user.email}
          </span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-red-600/50 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
        >
          {isSigningOut ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Sign Out</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Show sign in button when not authenticated
  return (
    <button
      onClick={handleSignIn}
      disabled={isSigningIn}
      className="flex items-center space-x-2 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
    >
      {isSigningIn ? (
        <>
          <div className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin"></div>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
};

export default GoogleAuthButton;
