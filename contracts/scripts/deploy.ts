import { ethers } from "hardhat";

async function main() {
  const mockUSDT = await ethers.deployContract("MockUSDT");
  await mockUSDT.waitForDeployment();

  const mockUSDTAddress = await mockUSDT.getAddress();

  const settlement = await ethers.deployContract("YuiDenSettlement", [mockUSDTAddress]);
  await settlement.waitForDeployment();

  const settlementAddress = await settlement.getAddress();

  console.log(`MockUSDT deployed to: ${mockUSDTAddress}`);
  console.log(`YuiDenSettlement deployed to: ${settlementAddress}`);
  console.log("");
  console.log("Add these to frontend .env.local:");
  console.log(`NEXT_PUBLIC_MOCK_USDT_ADDRESS=${mockUSDTAddress}`);
  console.log(`NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS=${settlementAddress}`);
  console.log("NEXT_PUBLIC_HASHKEY_CHAIN_ID=133");
  console.log("NEXT_PUBLIC_HASHKEY_RPC_URL=https://testnet.hsk.xyz");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
