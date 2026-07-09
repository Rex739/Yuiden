import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hashkeyTestnet: {
      url: process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz",
      chainId: 133,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
