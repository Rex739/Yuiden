export const mockUsdtAbi = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function faucet(address account)",
  "function mint(address account, uint256 amount)",
] as const;

export const yuidenSettlementAbi = [
  "function settleEnergy(address producer, uint256 kwhScaled, uint256 amount, string zone, uint256 co2SavedGrams) returns (uint256)",
  "function getSettlement(uint256 id) view returns (tuple(uint256 id,address producer,address buyer,uint256 kwhScaled,uint256 amount,string zone,uint256 co2SavedGrams,uint256 timestamp))",
  "function getSettlementCount() view returns (uint256)",
  "function settlements(uint256 id) view returns (uint256 id,address producer,address buyer,uint256 kwhScaled,uint256 amount,string zone,uint256 co2SavedGrams,uint256 timestamp)",
  "event EnergySettled(uint256 indexed id, address indexed producer, address indexed buyer, uint256 kwhScaled, uint256 amount, string zone, uint256 co2SavedGrams, uint256 timestamp)",
] as const;
