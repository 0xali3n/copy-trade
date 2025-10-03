// Backend signal service to notify backend of bot changes
class BackendSignalService {
  private backendUrl: string;

  constructor() {
    // Get backend URL from environment - must be set in .env file
    const backendPort = import.meta.env.VITE_BACKEND_PORT || "3001";
    const backendHost = import.meta.env.VITE_BACKEND_HOST || "localhost";
    this.backendUrl = `http://${backendHost}:${backendPort}`;

    console.log(
      `🔧 Backend Signal Service initialized with URL: ${this.backendUrl}`
    );
  }

  /**
   * Signal backend to refresh bots after database changes
   */
  async signalBotRefresh(): Promise<boolean> {
    try {
      console.log("🔄 Signaling backend to refresh bots...");
      console.log(`📡 Backend URL: ${this.backendUrl}/api/refresh-bots`);

      const response = await fetch(`${this.backendUrl}/api/refresh-bots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        `📊 Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ Backend signal failed: ${response.status} - ${errorText}`
        );
        throw new Error(
          `Backend signal failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("📋 Backend response:", result);

      if (result.success) {
        console.log("✅ Backend bots refreshed successfully");
        return true;
      } else {
        console.error("❌ Backend refresh failed:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error signaling backend:", error);
      console.error("🔍 Check if backend is running on:", this.backendUrl);
      return false;
    }
  }

  /**
   * Check if backend is reachable
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error("❌ Backend health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const backendSignalService = new BackendSignalService();
