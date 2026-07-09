import { HASHKEY_CHAIN_ID } from "@/lib/contracts";
import type { AgentDecision } from "@/lib/types";

export type HSPOrderStatus =
  | "draft"
  | "payment_requested"
  | "payment_confirmed"
  | "receipt_recorded"
  | "failed";

export type HSPEnergyOrder = {
  orderId: string;
  merchantReference: string;
  producer: string;
  buyer: string;
  zone: string;
  kwhScaled: number;
  co2SavedGrams: number;
  amountUSDT: string;
  amountJPY: number;
  currency: "USDT";
  settlementNetwork: "HashKey Chain";
  chainId: number;
  status: HSPOrderStatus;
  createdAt: string;
};

export type HSPReceiptPayload = {
  orderId: string;
  txHash?: string;
  producer: string;
  buyer: string;
  kwhScaled: number;
  amountUSDT: string;
  zone: string;
  co2SavedGrams: number;
  status: HSPOrderStatus;
  recordedAt: string;
};

export const HSP_ALIGNMENT_NOTE =
  "Prepared for official HSP merchant/order integration. Current execution records HashKey Chain receipt settlement.";

export function createHSPEnergyOrder({
  decision,
  producer,
  buyer,
  chainId = HASHKEY_CHAIN_ID,
  status = "draft",
}: {
  decision: AgentDecision;
  producer: string;
  buyer: string;
  chainId?: number;
  status?: HSPOrderStatus;
}): HSPEnergyOrder {
  const createdAt = new Date().toISOString();
  const orderId = `HSP-YDN-${Date.now().toString(36).toUpperCase()}`;

  return {
    orderId,
    merchantReference: `YUIDEN-${decision.producerId}-${decision.buyerId}-${Date.now()}`,
    producer,
    buyer,
    zone: decision.zone,
    kwhScaled: Math.round(decision.matchedKwh * 1000),
    co2SavedGrams: Math.round(decision.co2SavedKg * 1000),
    amountUSDT: decision.totalUSDT.toString(),
    amountJPY: decision.totalJPY,
    currency: "USDT",
    settlementNetwork: "HashKey Chain",
    chainId,
    status,
    createdAt,
  };
}

export function createHSPReceiptPayload({
  order,
  txHash,
  status,
}: {
  order: HSPEnergyOrder;
  txHash?: string;
  status: HSPOrderStatus;
}): HSPReceiptPayload {
  return {
    orderId: order.orderId,
    txHash,
    producer: order.producer,
    buyer: order.buyer,
    kwhScaled: order.kwhScaled,
    amountUSDT: order.amountUSDT,
    zone: order.zone,
    co2SavedGrams: order.co2SavedGrams,
    status,
    recordedAt: new Date().toISOString(),
  };
}
