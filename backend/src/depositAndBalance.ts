import { config, validateConfig, getTimestamp } from "./config";
import { kanaGet } from "./kanaClient";
import {
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  Account,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";

/**
 * Deposit and Balance Testing Script for Kana Labs Perps
 *
 * Tests:
 * 1. Get wallet account balance (before deposit)
 * 2. Get profile balance snapshot (before deposit)
 * 3. Deposit funds to trading account
 * 4. Get wallet account balance (after deposit)
 * 5. Get profile balance snapshot (after deposit)
 * 6. Compare balances to verify deposit
 */

interface BalanceInfo {
  walletBalance: number;
  profileBalance: number;
  timestamp: string;
}

class DepositAndBalanceTester {
  private aptos: Aptos;
  private account: Account;

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);

    // Create account from private key
    const formattedPrivateKey = PrivateKey.formatPrivateKey(
      config.aptosPrivateKeyHex,
      "ed25519" as PrivateKeyVariants
    );
    this.account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(formattedPrivateKey),
    });
  }

  async getWalletAccountBalance(): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
  }> {
    try {
      console.log(
        `[getWalletAccountBalance] ${getTimestamp()} - Getting wallet account balance...`
      );

      const response = await kanaGet(
        `/getWalletAccountBalance?userAddress=${this.account.accountAddress.toString()}`
      );

      if (response.error) {
        return {
          success: false,
          error: response.error,
        };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API returned error: ${
            response.data?.message || "Unknown error"
          }`,
        };
      }

      const balance = response.data.data;
      console.log(
        `[getWalletAccountBalance] ${getTimestamp()} - ✅ Wallet Balance: $${balance.toFixed(
          2
        )}`
      );

      return {
        success: true,
        balance: balance,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get wallet balance",
      };
    }
  }

  async getProfileBalanceSnapshot(): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
  }> {
    try {
      console.log(
        `[getProfileBalanceSnapshot] ${getTimestamp()} - Getting profile balance snapshot...`
      );

      const response = await kanaGet(
        `/getProfileBalanceSnapshot?userAddress=${this.account.accountAddress.toString()}`
      );

      if (response.error) {
        return {
          success: false,
          error: response.error,
        };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API returned error: ${
            response.data?.message || "Unknown error"
          }`,
        };
      }

      const balance = response.data.data;
      console.log(
        `[getProfileBalanceSnapshot] ${getTimestamp()} - ✅ Profile Balance: $${balance.toFixed(
          6
        )}`
      );

      return {
        success: true,
        balance: balance,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get profile balance",
      };
    }
  }

  async depositFunds(
    amount: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log(
        `[depositFunds] ${getTimestamp()} - Depositing $${amount.toFixed(
          2
        )} to trading account...`
      );

      // Step 1: Get deposit transaction payload from Kana Labs API
      console.log(
        `[depositFunds] ${getTimestamp()} - Step 1: Getting deposit transaction payload...`
      );

      const response = await kanaGet(
        `/deposit?userAddress=${this.account.accountAddress.toString()}&amount=${amount}`
      );

      if (response.error) {
        return {
          success: false,
          error: `Failed to get deposit payload: ${response.error}`,
        };
      }

      if (!response.data?.success) {
        return {
          success: false,
          error: `API returned error: ${
            response.data?.message || "Unknown error"
          }`,
        };
      }

      console.log(
        `[depositFunds] ${getTimestamp()} - ✅ Deposit payload received`
      );

      // Step 2: Submit deposit transaction to Aptos blockchain
      console.log(
        `[depositFunds] ${getTimestamp()} - Step 2: Submitting deposit transaction...`
      );

      const transactionResult = await this.submitDepositTransaction(
        response.data.data
      );
      if (!transactionResult.success) {
        return {
          success: false,
          error: transactionResult.error,
        };
      }

      console.log(
        `[depositFunds] ${getTimestamp()} - ✅ Deposit transaction submitted successfully`
      );
      console.log(
        `[depositFunds] ${getTimestamp()} - Transaction Hash: ${
          transactionResult.transactionHash
        }`
      );

      return {
        success: true,
        transactionHash: transactionResult.transactionHash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Deposit failed",
      };
    }
  }

  private async submitDepositTransaction(
    payloadData: any
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Build transaction using the payload from Kana Labs
      const transactionPayload = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: payloadData,
      });

      // Sign and submit transaction
      const committedTxn =
        await this.aptos.transaction.signAndSubmitTransaction({
          transaction: transactionPayload,
          signer: this.account,
        });

      // Wait for transaction confirmation
      const response = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (response.success) {
        return {
          success: true,
          transactionHash: committedTxn.hash,
        };
      } else {
        return {
          success: false,
          error: "Deposit transaction failed on blockchain",
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Transaction submission failed",
      };
    }
  }

  async runDepositAndBalanceTest(): Promise<void> {
    try {
      validateConfig();

      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ==========================================`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - DEPOSIT AND BALANCE TESTING`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - Account: ${this.account.accountAddress.toString()}`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ==========================================`
      );

      // Step 1: Get balances BEFORE deposit
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📊 STEP 1: Getting balances BEFORE deposit...`
      );

      const walletBalanceBefore = await this.getWalletAccountBalance();
      const profileBalanceBefore = await this.getProfileBalanceSnapshot();

      if (!walletBalanceBefore.success) {
        console.log(
          `[runDepositAndBalanceTest] ${getTimestamp()} - ❌ Failed to get wallet balance: ${
            walletBalanceBefore.error
          }`
        );
        return;
      }

      if (!profileBalanceBefore.success) {
        console.log(
          `[runDepositAndBalanceTest] ${getTimestamp()} - ⚠️  Profile balance not available (profile doesn't exist yet): ${
            profileBalanceBefore.error
          }`
        );
        console.log(
          `[runDepositAndBalanceTest] ${getTimestamp()} - 📝 This is normal for new users - profile will be created during deposit`
        );
      }

      const beforeBalances: BalanceInfo = {
        walletBalance: walletBalanceBefore.balance || 0,
        profileBalance: profileBalanceBefore.balance || 0,
        timestamp: getTimestamp(),
      };

      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📊 BEFORE DEPOSIT BALANCES:`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   Wallet Balance: $${beforeBalances.walletBalance.toFixed(
          2
        )}`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   Profile Balance: $${beforeBalances.profileBalance.toFixed(
          6
        )}`
      );

      // Step 2: Deposit funds
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 💰 STEP 2: Depositing funds...`
      );

      const depositAmount = 1; // $0.01 (in cents: 1)
      const depositResult = await this.depositFunds(depositAmount);

      if (!depositResult.success) {
        console.log(
          `[runDepositAndBalanceTest] ${getTimestamp()} - ❌ Deposit failed: ${
            depositResult.error
          }`
        );
        return;
      }

      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ✅ Deposit successful!`
      );

      // Wait a moment for the transaction to be processed
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ⏳ Waiting for transaction to be processed...`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Step 3: Get balances AFTER deposit
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📊 STEP 3: Getting balances AFTER deposit...`
      );

      const walletBalanceAfter = await this.getWalletAccountBalance();
      const profileBalanceAfter = await this.getProfileBalanceSnapshot();

      if (!walletBalanceAfter.success) {
        console.log(
          `[runDepositAndBalanceTest] ${getTimestamp()} - ❌ Failed to get wallet balance after: ${
            walletBalanceAfter.error
          }`
        );
        return;
      }

      if (!profileBalanceAfter.success) {
        console.log(
          `[runDepositAndBalanceTest] ${getTimestamp()} - ❌ Failed to get profile balance after: ${
            profileBalanceAfter.error
          }`
        );
        console.log(
          `[runDepositAndBalanceTest] ${getTimestamp()} - 📝 This might indicate the deposit is still processing or there was an issue`
        );
        return;
      }

      const afterBalances: BalanceInfo = {
        walletBalance: walletBalanceAfter.balance || 0,
        profileBalance: profileBalanceAfter.balance || 0,
        timestamp: getTimestamp(),
      };

      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📊 AFTER DEPOSIT BALANCES:`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   Wallet Balance: $${afterBalances.walletBalance.toFixed(
          2
        )}`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   Profile Balance: $${afterBalances.profileBalance.toFixed(
          6
        )}`
      );

      // Step 4: Calculate and display changes
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📈 STEP 4: Analyzing balance changes...`
      );

      const walletChange =
        afterBalances.walletBalance - beforeBalances.walletBalance;
      const profileChange =
        afterBalances.profileBalance - beforeBalances.profileBalance;

      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📈 BALANCE CHANGES:`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   Wallet Balance Change: $${walletChange.toFixed(
          2
        )}`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   Profile Balance Change: $${profileChange.toFixed(
          6
        )}`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   Expected Deposit: $${(
          depositAmount / 100
        ).toFixed(2)}`
      );

      // Step 5: Summary and explanation
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ==========================================`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - DEPOSIT AND BALANCE TEST SUMMARY`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ==========================================`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ✅ Deposit Transaction: SUCCESS`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📊 Transaction Hash: ${
          depositResult.transactionHash
        }`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 💰 Deposit Amount: $${(
          depositAmount / 100
        ).toFixed(2)}`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📈 Profile Balance Change: $${profileChange.toFixed(
          6
        )}`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ==========================================`
      );

      // Explanation of balance types
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📚 BALANCE TYPE EXPLANATIONS:`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ==========================================`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 🏦 WALLET BALANCE (getWalletAccountBalance):`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - Your main Aptos wallet balance (USDC)`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - This is where your funds are stored`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - Decreases when you deposit to trading account`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - Increases when you withdraw from trading account`
      );
      console.log(`[runDepositAndBalanceTest] ${getTimestamp()} - `);
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - 📊 PROFILE BALANCE SNAPSHOT (getProfileBalanceSnapshot):`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - Your trading account balance (USDC)`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - This is where your trading funds are stored`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - Increases when you deposit from wallet`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - Decreases when you place trades or withdraw`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} -   - This is the balance used for trading operations`
      );
      console.log(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ==========================================`
      );
    } catch (error) {
      console.error(
        `[runDepositAndBalanceTest] ${getTimestamp()} - ❌ Test failed:`,
        error
      );
      process.exit(1);
    }
  }
}

// Run the deposit and balance test
export async function getDepositAndBalance(): Promise<any> {
  try {
    const tester = new DepositAndBalanceTester();
    await tester.runDepositAndBalanceTest();
  } catch (error) {
    console.error(
      `[testDepositAndBalance] ${getTimestamp()} - ❌ Test suite failed:`,
      error
    );
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  getDepositAndBalance();
}
