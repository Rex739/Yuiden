import type { HSPEnergyOrder, HSPReceiptPayload } from "@/lib/hsp";
import type { YuiDenAgentForecast, YuiDenAgentScore, YuiDenAgentOutput } from "@/lib/yuidenAgent";
import type { WeatherSnapshot } from "@/lib/weather";

export type HouseMeter = {
  id: string;
  name: string;
  wallet: string;
  zone: string;
  solarKwh: number;
  consumptionKwh: number;
  batteryKwh: number;
  maxBatteryKwh: number;
};

export type AgentDecision = {
  producerId: string;
  buyerId: string;
  producerName: string;
  buyerName: string;
  matchedKwh: number;
  pricePerKwhJPY: number;
  totalJPY: number;
  totalUSDT: number;
  zone: string;
  co2SavedKg: number;
  reason: string;
  confidence: number;
  weather?: WeatherSnapshot;
  forecast?: YuiDenAgentForecast;
  score?: YuiDenAgentScore;
  localExplanation?: YuiDenAgentOutput["localExplanation"];
  reasoning?: AgentReasoning;
};

export type AgentReasoning = {
  source: "openai" | "deterministic";
  summary: string;
  weatherImpact: string;
  settlementRationale: string;
};

export type EnergyReceipt = {
  id: string;
  producerName: string;
  buyerName: string;
  matchedKwh: number;
  totalJPY: number;
  totalUSDT: number;
  zone: string;
  co2SavedKg: number;
  timestamp: string;
  txHash?: string;
  status: "local" | "onchain";
  hspOrder?: HSPEnergyOrder;
  hspReceipt?: HSPReceiptPayload;
};
