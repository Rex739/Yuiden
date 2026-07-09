import { NextResponse } from "next/server";
import { createAgentReasoning } from "@/lib/aiReasoning";
import { fetchTokyoWeatherSnapshot } from "@/lib/weather";
import { attachAgentReasoning, runYuiDenEnergySettlementAgent } from "@/lib/yuidenAgent";
import { houses, runYuidenAgent } from "@/lib/yuiden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const weather = await fetchTokyoWeatherSnapshot();
    const agentOutput = runYuiDenEnergySettlementAgent({ houses, weather });
    const reasoning = await createAgentReasoning(agentOutput.decision, weather);

    return NextResponse.json({
      agent: agentOutput,
      decision: attachAgentReasoning(agentOutput, weather, reasoning),
    });
  } catch {
    const baseDecision = runYuidenAgent(houses);

    return NextResponse.json({
      decision: {
        ...baseDecision,
        reasoning: {
          source: "deterministic",
          summary: baseDecision.reason,
          weatherImpact: "Weather-aware reasoning was unavailable, so YuiDen used deterministic local matching.",
          settlementRationale:
            "Deterministic matching remains the source of truth for settlement values.",
        },
      },
    });
  }
}
