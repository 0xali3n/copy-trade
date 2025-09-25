// Session management utilities
export interface SessionData {
  token: string;
  expiresAt: string;
  user: any;
}

export class SessionManager {
  private static readonly SESSION_KEY = "session_token";
  private static readonly USER_KEY = "user_data";
  private static readonly EXPIRES_KEY = "session_expires";

  // Save session data
  static saveSession(sessionData: SessionData): void {
    try {
      localStorage.setItem(this.SESSION_KEY, sessionData.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(sessionData.user));
      localStorage.setItem(this.EXPIRES_KEY, sessionData.expiresAt);
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  // Get session token
  static getSessionToken(): string | null {
    try {
      return localStorage.getItem(this.SESSION_KEY);
    } catch (error) {
      console.error("Failed to get session token:", error);
      return null;
    }
  }

  // Get user data
  static getUserData(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to get user data:", error);
      return null;
    }
  }

  // Check if session is valid
  static isSessionValid(): boolean {
    try {
      const token = this.getSessionToken();
      const expiresAt = localStorage.getItem(this.EXPIRES_KEY);

      if (!token || !expiresAt) {
        return false;
      }

      const now = new Date();
      const expirationDate = new Date(expiresAt);

      return now < expirationDate;
    } catch (error) {
      console.error("Failed to check session validity:", error);
      return false;
    }
  }

  // Clear session data
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.EXPIRES_KEY);
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  }

  // Get session info
  static getSessionInfo(): {
    token: string | null;
    user: any | null;
    isValid: boolean;
  } {
    return {
      token: this.getSessionToken(),
      user: this.getUserData(),
      isValid: this.isSessionValid(),
    };
  }

  // Auto-refresh session (if needed)
  static async refreshSession(): Promise<boolean> {
    try {
      const token = this.getSessionToken();
      if (!token) {
        return false;
      }

      // Make a request to verify the session
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update user data if needed
          this.saveSession({
            token,
            expiresAt: localStorage.getItem(this.EXPIRES_KEY) || "",
            user: data.user,
          });
          return true;
        }
      }

      // Session is invalid, clear it
      this.clearSession();
      return false;
    } catch (error) {
      console.error("Failed to refresh session:", error);
      this.clearSession();
      return false;
    }
  }
}
