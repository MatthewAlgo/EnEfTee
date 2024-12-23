import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Ensure the seed phrase is available
if (!process.env.SEED_PHRASE) {
  throw new Error("Please set your SEED_PHRASE in a .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      accounts: {
        mnemonic: process.env.SEED_PHRASE,
        // Specify the number of accounts and initial balance
        count: 20,
        accountsBalance: "10000000000000000000000" // 10000 ETH in wei
      },
      chainId: 31337
    }
  }
};

export default config;
