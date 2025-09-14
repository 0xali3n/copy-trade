import { config, validateConfig, getTimestamp } from "./config";
import { kanaGet } from "./kanaClient";

/**
 * Get user profile from Kana Labs API
 * Calls GET /getProfileAddress?userAddress=0x...
 */

async function getProfile(): Promise<void> {
  console.log(`[getProfile] ${getTimestamp()} - Starting profile fetch...`);

  try {
    // Validate configuration
    validateConfig();

    if (!config.aptosAddress) {
      console.error(
        `[getProfile] ${getTimestamp()} - ❌ APTOS_ADDRESS not set in .env file`
      );
      console.error(
        `[getProfile] ${getTimestamp()} - Please set APTOS_ADDRESS in your .env file`
      );
      process.exit(1);
    }

    console.log(
      `[getProfile] ${getTimestamp()} - Fetching profile for address: ${
        config.aptosAddress
      }`
    );

    // Make API call to get profile
    const response = await kanaGet(
      `/getProfileAddress?userAddress=${config.aptosAddress}`
    );

    if (response.error) {
      console.error(
        `[getProfile] ${getTimestamp()} - ❌ API Error: ${response.error}`
      );

      if (response.status === 401 || response.status === 403) {
        console.error(
          `[getProfile] ${getTimestamp()} - 🔑 Check your KANA_API_KEY in .env file`
        );
        console.error(
          `[getProfile] ${getTimestamp()} - Make sure you have a valid API key from hello@kanalabs.io`
        );
      }

      if (response.message) {
        console.error(
          `[getProfile] ${getTimestamp()} - Message: ${response.message}`
        );
      }

      process.exit(1);
    }

    // Log successful response
    console.log(
      `[getProfile] ${getTimestamp()} - ✅ Profile fetched successfully!`
    );

    if (response.data) {
      // Try to extract profile address from response
      const profileAddress =
        response.data.profileAddress ||
        response.data.address ||
        response.data.profile_address ||
        response.data.userAddress;

      if (profileAddress) {
        console.log(
          `[getProfile] ${getTimestamp()} - Profile address: ${profileAddress}`
        );
      } else {
        console.log(
          `[getProfile] ${getTimestamp()} - Profile data received but no address field found`
        );
        console.log(
          `[getProfile] ${getTimestamp()} - Available fields:`,
          Object.keys(response.data)
        );
      }

      // Log any other relevant fields
      if (response.data.status) {
        console.log(
          `[getProfile] ${getTimestamp()} - Status: ${response.data.status}`
        );
      }
      if (response.data.balance) {
        console.log(
          `[getProfile] ${getTimestamp()} - Balance: ${response.data.balance}`
        );
      }
    } else {
      console.log(`[getProfile] ${getTimestamp()} - No data in response`);
    }
  } catch (error) {
    console.error(
      `[getProfile] ${getTimestamp()} - ❌ Unexpected error:`,
      error
    );
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  getProfile();
}
