import { HASHKEY_TESTNET_EXPLORER_TX_URL } from "@/lib/constants";

export const HASHKEY_CHAIN_ID = Number(process.env.NEXT_PUBLIC_HASHKEY_CHAIN_ID || 133);
export const HASHKEY_CHAIN_ID_HEX = `0x${HASHKEY_CHAIN_ID.toString(16)}`;
export const HASHKEY_RPC_URL =
  process.env.NEXT_PUBLIC_HASHKEY_RPC_URL || "https://testnet.hsk.xyz";

export const MOCK_USDT_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS || "";
export const YUIDEN_SETTLEMENT_ADDRESS =
  process.env.NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS || "";

export const hasContractConfig = Boolean(MOCK_USDT_ADDRESS && YUIDEN_SETTLEMENT_ADDRESS);

export function getTxExplorerUrl(txHash: string) {
  return `${HASHKEY_TESTNET_EXPLORER_TX_URL}/${txHash}`;
}
