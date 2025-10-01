import React from "react";
import { useAuth } from "../contexts/AuthContext";

const AuthDebug: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    testDatabase,
    checkDatabaseSchema,
  } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono max-w-sm border border-white/20 z-50">
      <div className="font-bold mb-2 text-green-400">Auth Debug:</div>
      <div>
        Loading:{" "}
        <span className={isLoading ? "text-yellow-400" : "text-green-400"}>
          {isLoading ? "true" : "false"}
        </span>
      </div>
      <div>
        Authenticated:{" "}
        <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>
          {isAuthenticated ? "true" : "false"}
        </span>
      </div>
      <div>
        User: <span className="text-blue-400">{user?.email || "null"}</span>
      </div>
      <div>
        User ID:{" "}
        <span className="text-blue-400">
          {user?.id ? user.id.slice(0, 8) + "..." : "null"}
        </span>
      </div>
      <div>
        Full Name:{" "}
        <span className="text-blue-400">{user?.full_name || "null"}</span>
      </div>
      <div>
        Active Account:{" "}
        <span className="text-blue-400">
          {user?.aptos_public_key || "Not created"}
        </span>
      </div>
      <div className="flex space-x-2 mt-2">
        <button
          onClick={testDatabase}
          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
        >
          Test DB
        </button>
        <button
          onClick={checkDatabaseSchema}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
        >
          Check Schema
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
