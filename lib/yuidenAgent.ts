import type { AgentReasoning } from "./aiReasoning";
import type { HouseMeter, AgentDecision } from "./types";
import type { WeatherSnapshot } from "./weather";
import { getDemand, getSurplus, runYuidenAgent } from "./yuiden";

export type YuiDenAgentInput = {
  houses: HouseMeter[];
  weather: WeatherSnapshot;
};

export type YuiDenAgentForecast = {
  solarMultiplier: number;
  demandBias: "low" | "normal" | "high";
  expectedSurplusKwh: number;
  expectedDemandKwh: number;
  weatherAdjustedProductionKwh: number;
  weatherAdjustedDemandKwh: number;
};

export type YuiDenAgentScore = {
  confidence: number;
  localityScore: number;
  weatherScore: number;
  balanceScore: number;
  settlementReadinessScore: number;
};

export type YuiDenAgentOutput = {
  decision: AgentDecision;
  forecast: YuiDenAgentForecast;
  score: YuiDenAgentScore;
  localExplanation: {
    summary: string;
    matchRationale: string;
    weatherRationale: string;
    pricingRationale: string;
    riskNote: string;
    optimizationTip: string;
    confidenceExplanation: string;
  };
};

export function runYuiDenEnergySettlementAgent(input: YuiDenAgentInput): YuiDenAgentOutput {
  const decision = runYuidenAgent(input.houses);
  const forecast = createForecast(input.houses, input.weather);
  const score = createScore(input.houses, decision, forecast, input.weather);
  const localExplanation = createLocalExplanation(decision, forecast, score, input.weather);

  return {
    decision: {
      ...decision,
      confidence: score.confidence,
    },
    forecast,
    score,
    localExplanation,
  };
}

export function attachAgentReasoning(
  output: YuiDenAgentOutput,
  weather: WeatherSnapshot,
  reasoning: AgentReasoning,
): AgentDecision {
  return {
    ...output.decision,
    weather,
    forecast: output.forecast,
    score: output.score,
    localExplanation: output.localExplanation,
    reasoning,
  };
}

function createForecast(houses: HouseMeter[], weather: WeatherSnapshot): YuiDenAgentForecast {
  const baseProductionKwh = houses.reduce((sum, house) => sum + house.solarKwh + house.batteryKwh, 0);
  const baseDemandKwh = houses.reduce((sum, house) => sum + house.consumptionKwh, 0);
  const demandMultiplier = weather.demandBias === "high" ? 1.08 : weather.demandBias === "low" ? 0.94 : 1;
  const weatherAdjustedProductionKwh = Number((baseProductionKwh * weather.solarMultiplier).toFixed(2));
  const weatherAdjustedDemandKwh = Number((baseDemandKwh * demandMultiplier).toFixed(2));

  return {
    solarMultiplier: weather.solarMultiplier,
    demandBias: weather.demandBias,
    expectedSurplusKwh: Number(Math.max(weatherAdjustedProductionKwh - weatherAdjustedDemandKwh, 0).toFixed(2)),
    expectedDemandKwh: Number(Math.max(weatherAdjustedDemandKwh - weatherAdjustedProductionKwh, 0).toFixed(2)),
    weatherAdjustedProductionKwh,
    weatherAdjustedDemandKwh,
  };
}

function createScore(
  houses: HouseMeter[],
  decision: AgentDecision,
  forecast: YuiDenAgentForecast,
  weather: WeatherSnapshot,
): YuiDenAgentScore {
  const producer = houses.find((house) => house.id === decision.producerId);
  const buyer = houses.find((house) => house.id === decision.buyerId);
  const localityScore = producer && buyer && producer.zone === buyer.zone ? 98 : 74;
  const weatherScore = clamp(Math.round(weather.solarMultiplier * 82), 45, 98);
  const balanceScore = clamp(Math.round((decision.matchedKwh / Math.max(forecast.weatherAdjustedDemandKwh, 1)) * 100), 50, 96);
  const settlementReadinessScore = decision.totalUSDT > 0 && decision.matchedKwh > 0 ? 92 : 52;
  const confidence = clamp(
    Math.round(localityScore * 0.34 + weatherScore * 0.22 + balanceScore * 0.24 + settlementReadinessScore * 0.2),
    50,
    98,
  );

  return {
    confidence,
    localityScore,
    weatherScore,
    balanceScore,
    settlementReadinessScore,
  };
}

function createLocalExplanation(
  decision: AgentDecision,
  forecast: YuiDenAgentForecast,
  score: YuiDenAgentScore,
  weather: WeatherSnapshot,
): YuiDenAgentOutput["localExplanation"] {
  return {
    summary: `${decision.producerName} -> ${decision.buyerName} is the best verifiable settlement route for the current Tokyo forecast and simulated meter state.`,
    matchRationale: decision.reason,
    weatherRationale: `${weather.summary} The agent uses this as advisory context, not as a source of settlement truth.`,
    pricingRationale: `Price remains deterministic at ¥${decision.pricePerKwhJPY}/kWh, producing ¥${decision.totalJPY} / ${decision.totalUSDT} USDT for ${decision.matchedKwh} kWh.`,
    riskNote:
      weather.solarCondition === "weak"
        ? "Weak solar conditions lower confidence, so settlement should remain conservative."
        : "Weather risk is acceptable for a demo settlement route.",
    optimizationTip:
      forecast.expectedSurplusKwh > 0
        ? "Use the expected surplus window for faster same-zone matching."
        : "Watch demand pressure and battery levels before expanding cross-zone routes.",
    confidenceExplanation: `Confidence ${score.confidence}% blends locality (${score.localityScore}), weather (${score.weatherScore}), balance (${score.balanceScore}), and settlement readiness (${score.settlementReadinessScore}).`,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
