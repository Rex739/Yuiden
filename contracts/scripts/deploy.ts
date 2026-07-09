import { ethers, network } from "hardhat";

type HashKeyDeployNetwork = {
  chainId: number;
  explorerUrl: string;
  frontendRpcUrl: string;
};

const HASHKEY_NETWORKS: Record<string, HashKeyDeployNetwork> = {
  hashkeyTestnet: {
    chainId: 133,
    explorerUrl: "https://hashkeychain-testnet-explorer.alt.technology",
    frontendRpcUrl: "https://testnet.hsk.xyz",
  },
  hashkeyMainnet: {
    chainId: 177,
    explorerUrl: "https://hashkey.blockscout.com",
    frontendRpcUrl: "https://mainnet.hsk.xyz",
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const activeNetwork = HASHKEY_NETWORKS[network.name];
  const chain = await ethers.provider.getNetwork();
  const chainId = Number(chain.chainId);
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  const explorerUrl = activeNetwork?.explorerUrl ?? "";
  const frontendChainId = activeNetwork?.chainId ?? chainId;
  const frontendRpcUrl = activeNetwork?.frontendRpcUrl ?? "";

  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(deployerBalance)} HSK`);
  console.log("");

  const mockUSDT = await ethers.deployContract("MockUSDT");
  await mockUSDT.waitForDeployment();

  const mockUSDTAddress = await mockUSDT.getAddress();

  const settlement = await ethers.deployContract("YuiDenSettlement", [mockUSDTAddress]);
  await settlement.waitForDeployment();

  const settlementAddress = await settlement.getAddress();

  console.log(`MockUSDT deployed to: ${mockUSDTAddress}`);
  console.log(`YuiDenSettlement deployed to: ${settlementAddress}`);
  if (explorerUrl) {
    console.log(`MockUSDT explorer: ${explorerUrl}/address/${mockUSDTAddress}`);
    console.log(`YuiDenSettlement explorer: ${explorerUrl}/address/${settlementAddress}`);
  }
  console.log("");
  console.log("Add these to frontend .env.local:");
  console.log(`NEXT_PUBLIC_MOCK_USDT_ADDRESS=${mockUSDTAddress}`);
  console.log(`NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS=${settlementAddress}`);
  console.log(`NEXT_PUBLIC_HASHKEY_CHAIN_ID=${frontendChainId}`);
  console.log(`NEXT_PUBLIC_HASHKEY_RPC_URL=${frontendRpcUrl}`);
  console.log(`NEXT_PUBLIC_HASHKEY_EXPLORER_URL=${explorerUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
