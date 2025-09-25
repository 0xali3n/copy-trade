import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("session_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid session
      localStorage.removeItem("session_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("session_expires");
      // Don't redirect automatically, let the auth context handle it
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Login with wallet
  login: async (walletAddress: string, walletName?: string) => {
    const response = await api.post("/auth/login", {
      walletAddress,
      walletName,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData: any) => {
    const response = await api.put("/auth/profile", {
      profile_data: profileData,
    });
    return response.data;
  },

  // Update trading settings
  updateSettings: async (settings: any) => {
    const response = await api.put("/auth/settings", settings);
    return response.data;
  },

  // Verify session
  verify: async () => {
    const response = await api.get("/auth/verify");
    return response.data;
  },
};

// Trading API functions
export const tradingAPI = {
  // Get trading status
  getStatus: async () => {
    const response = await api.get("/trading/status");
    return response.data;
  },

  // Start copy trading
  startCopyTrading: async (config: any) => {
    const response = await api.post("/trading/start", config);
    return response.data;
  },

  // Stop copy trading
  stopCopyTrading: async () => {
    const response = await api.post("/trading/stop");
    return response.data;
  },

  // Get trading activity
  getActivity: async () => {
    const response = await api.get("/trading/activity");
    return response.data;
  },
};

// Dashboard API functions
export const dashboardAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get("/dashboard/profile");
    return response.data;
  },

  // Get balance
  getBalance: async () => {
    const response = await api.get("/dashboard/balance");
    return response.data;
  },

  // Get markets
  getMarkets: async () => {
    const response = await api.get("/dashboard/markets");
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
};
