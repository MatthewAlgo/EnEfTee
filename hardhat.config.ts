const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.SEED_PHRASE) {
  throw new Error("Please set your SEED_PHRASE in a .env file");
}

const config = {
  solidity: {
    version: "0.8.19", // Change to 0.8.19
    compilers: [
      {
        version: "0.8.19",
      },
      {
        version: "0.8.18",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: process.env.SEED_PHRASE,
      },
      chainId: 31337,
    },
  },
};

module.exports = config;
