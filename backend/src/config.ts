import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

// Helper function to get current timestamp for logging
export function getTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}
