import { Contract, formatUnits, getAddress, isAddress, ZeroAddress } from "ethers";
import { HASHKEY_CHAIN_ID } from "@/lib/contracts";
import { createHSPEnergyOrder } from "@/lib/hsp";
import type { AgentDecision, EnergyReceipt } from "@/lib/types";
import { houses } from "@/lib/yuiden";

export async function readTokenDecimals(token: Contract) {
  try {
    const decimals = await token.decimals();
    return Number(decimals);
  } catch {
    return 18;
  }
}

export function formatTokenAmount(amount: bigint, decimals: number) {
  const formatted = formatUnits(amount, decimals);
  const numeric = Number(formatted);

  if (!Number.isFinite(numeric)) {
    return formatted;
  }

  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export async function tryMintDemoUsdt(token: Contract, account: string, amount: bigint) {
  try {
    const faucetTx = await token.faucet(account);
    await faucetTx.wait();
    return true;
  } catch {
    try {
      const mintTx = await token.mint(account, amount);
      await mintTx.wait();
      return true;
    } catch {
      return false;
    }
  }
}

export function getValidProducerAddress(candidate: string, buyerAddress: string) {
  const normalizedBuyer = getAddress(buyerAddress);

  if (isAddress(candidate)) {
    const producer = getAddress(candidate);

    if (producer !== ZeroAddress && producer.toLowerCase() !== normalizedBuyer.toLowerCase()) {
      return producer;
    }
  }

  const fallbackProducer = houses.find((house) => {
    if (!isAddress(house.wallet)) return false;

    const producer = getAddress(house.wallet);
    return producer !== ZeroAddress && producer.toLowerCase() !== normalizedBuyer.toLowerCase();
  });

  return fallbackProducer ? getAddress(fallbackProducer.wallet) : null;
}

export function createLocalHSPOrder(activeDecision: AgentDecision) {
  const producer = houses.find((house) => house.id === activeDecision.producerId);
  const buyer = houses.find((house) => house.id === activeDecision.buyerId);

  return createHSPEnergyOrder({
    decision: activeDecision,
    producer: producer?.wallet ?? "local-producer",
    buyer: buyer?.wallet ?? "local-buyer",
    chainId: HASHKEY_CHAIN_ID,
    status: "receipt_recorded",
  });
}

export const placeholderReceipts: EnergyReceipt[] = [
  {
    id: "YDN-PREV",
    producerName: "Sakura House",
    buyerName: "Kumo Residence",
    matchedKwh: 11.4,
    totalJPY: 313,
    totalUSDT: 2.01,
    zone: "Tokyo-East",
    co2SavedKg: 5.02,
    timestamp: "Preview receipt",
    status: "local",
  },
];

export function getFriendlyError(error: unknown) {
  const errorLike = error as { code?: string | number; reason?: string; shortMessage?: string; message?: string };
  const message = errorLike.shortMessage || errorLike.reason || errorLike.message;

  if (errorLike.code === 4001 || errorLike.code === "ACTION_REJECTED") {
    return "Wallet action was rejected.";
  }

  if (message) {
    if (message.toLowerCase().includes("user rejected") || message.toLowerCase().includes("rejected")) {
      return "Wallet action was rejected.";
    }

    if (message.toLowerCase().includes("insufficient funds")) {
      return "Wallet has insufficient gas funds for the configured HashKey network.";
    }

    if (message.toLowerCase().includes("missing revert data")) {
      return "The settlement contract rejected the transaction. Check MockUSDT balance, allowance, and contract addresses.";
    }

    return message.length > 160 ? `${message.slice(0, 157)}...` : message;
  }

  if (error instanceof Error && error.message) {
    if (error.message.includes("user rejected")) {
      return "Wallet action was rejected.";
    }

    if (error.message.includes("insufficient funds")) {
      return "Wallet has insufficient gas funds for the configured HashKey network.";
    }

    return error.message.length > 160 ? `${error.message.slice(0, 157)}...` : error.message;
  }

  return "Something went wrong while preparing the on-chain settlement.";
}
