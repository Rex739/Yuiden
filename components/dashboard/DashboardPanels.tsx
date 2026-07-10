import { ACTIVE_HASHKEY_CHAIN, hasContractConfig } from "@/lib/contracts";
import type { AgentDecision } from "@/lib/types";
import { Meter, MiniStat, StatusPill } from "@/components/dashboard/DashboardPrimitives";

export function DecisionPanel({
  decision,
  isAgentRunning,
  onRunAgent,
}: {
  decision: AgentDecision | null;
  isAgentRunning: boolean;
  onRunAgent: () => void | Promise<void>;
}) {
  const confidence = decision?.confidence ?? 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-[2rem] border border-[#123D24] bg-[#123D24] text-white shadow-soft sm:rounded-[2.5rem]">
      <div className="bg-[linear-gradient(135deg,#123D24,#0D3500)] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase text-[#9BE870]">YuiDen Agent</p>
          <h2 className="mt-2 [font-family:var(--font-rowdies)] text-3xl font-black uppercase leading-none text-[#9BE870] sm:text-4xl">
            AI settlement decision
          </h2>
        </div>
        <button
          onClick={onRunAgent}
          disabled={isAgentRunning}
          className="w-full rounded-full bg-[#9BE870] px-6 py-4 font-black text-[#071A12] shadow-glow disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        >
          {isAgentRunning ? "Checking Weather..." : "Run YuiDen Agent"}
        </button>
      </div>
      </div>

      {decision ? (
        <div className="p-5 sm:p-7">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6">
            <p className="text-sm font-bold text-white/55">Recommended producer to buyer route</p>
            <p className="mt-4 break-words [font-family:var(--font-rowdies)] text-3xl font-black leading-none text-white sm:text-4xl">
              {decision.producerName} &rarr; {decision.buyerName}
            </p>
            <p className="mt-4 leading-7 text-white/70">{decision.reason}</p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MiniStat label="Matched energy" value={`${decision.matchedKwh} kWh`} />
            <MiniStat label="Dynamic price" value={`¥${decision.pricePerKwhJPY}/kWh`} />
            <MiniStat label="Zone" value={decision.zone} />
          </div>
          {decision.weather ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <MiniStat label="Tokyo solar" value={`${decision.weather.solarCondition} ${decision.weather.solarMultiplier.toFixed(2)}x`} />
              <MiniStat label="Cloud cover" value={`${Math.round(decision.weather.cloudCoverPct)}%`} />
              <MiniStat label="Demand bias" value={decision.weather.demandBias} />
            </div>
          ) : null}
          {decision.score ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <MiniStat label="Locality score" value={`${decision.score.localityScore}%`} />
              <MiniStat label="Balance score" value={`${decision.score.balanceScore}%`} />
              <MiniStat label="Settlement ready" value={`${decision.score.settlementReadinessScore}%`} />
            </div>
          ) : null}
          {decision.reasoning ? (
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#9BE870] px-3 py-1 text-xs font-black uppercase text-[#071A12]">
                  {decision.reasoning.source === "openai" ? "OpenAI reasoning" : "Deterministic reasoning"}
                </span>
                {decision.weather ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/70">
                    Weather: {decision.weather.source}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-bold leading-6 text-white/75">{decision.reasoning.summary}</p>
              {decision.localExplanation ? (
                <p className="mt-3 text-sm font-bold leading-6 text-white/65">{decision.localExplanation.riskNote}</p>
              ) : null}
              <p className="mt-3 text-xs font-bold leading-5 text-white/50">{decision.reasoning.settlementRationale}</p>
            </div>
          ) : null}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-white/70">
              <span>Confidence meter</span>
              <span>{confidence}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-[#9BE870]" style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="m-5 rounded-[2rem] border border-white/10 bg-white/10 p-5 leading-7 text-white/70 sm:m-7 sm:p-6">
          Run the agent to generate the local energy route, confidence score, price, and settlement recommendation.
        </div>
      )}
    </section>
  );
}

export function SettlementPanel({
  decision,
  walletAddress,
  isCorrectNetwork,
  mockUsdtBalance,
  needsAllowance,
  isSettling,
  onSettlement,
  onLocalFallback,
}: {
  decision: AgentDecision | null;
  walletAddress: string;
  isCorrectNetwork: boolean;
  mockUsdtBalance: string;
  needsAllowance: boolean;
  isSettling: boolean;
  onSettlement: () => void;
  onLocalFallback: () => void;
}) {
  return (
    <section className="min-w-0 rounded-[2rem] border border-[#E5E7EB] bg-white/92 p-5 shadow-soft backdrop-blur sm:rounded-[2.5rem] sm:p-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-black uppercase text-[#20C997]">Transaction approval</p>
          <h2 className="mt-2 [font-family:var(--font-rowdies)] text-3xl font-black uppercase leading-none sm:text-4xl">Settlement preview</h2>
        </div>
        <StatusPill tone={walletAddress && hasContractConfig && isCorrectNetwork ? "green" : "amber"}>
          {walletAddress && hasContractConfig && isCorrectNetwork ? "On-chain ready" : "Local fallback"}
        </StatusPill>
      </div>
      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
        <Meter label="Total JPY" value={decision ? `¥${decision.totalJPY}` : "Pending"} />
        <Meter label="Total USDT" value={decision ? `${decision.totalUSDT} USDT` : "Pending"} />
        <Meter label="Matched kWh" value={decision ? `${decision.matchedKwh} kWh` : "Pending"} />
        <Meter label="CO2 saved" value={decision ? `${decision.co2SavedKg} kg` : "Pending"} />
        <Meter label="MockUSDT balance" value={mockUsdtBalance} />
        <Meter label="Approval state" value={needsAllowance ? "Allowance needed" : "Ready"} />
        <Meter label="Settlement mode" value={walletAddress && hasContractConfig && isCorrectNetwork ? ACTIVE_HASHKEY_CHAIN.chainName : "Local fallback"} />
        <Meter label="Expected receipt" value={walletAddress && hasContractConfig && isCorrectNetwork ? "On-chain" : "Local fallback"} />
      </div>
      <button
        onClick={onSettlement}
        disabled={isSettling}
        className="mt-6 w-full rounded-full bg-[#9BE870] px-6 py-4 font-black text-[#071A12] shadow-[0_18px_48px_rgba(155,232,112,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSettling ? "Settling..." : "Execute HSP-Aligned Settlement"}
      </button>
      <button
        onClick={onLocalFallback}
        disabled={isSettling}
        className="mt-3 w-full rounded-full border border-[#123D24]/15 bg-[#FFFDF7] px-6 py-4 font-black text-[#123D24] transition hover:bg-[#FFF3D1] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Create Local Fallback Receipt
      </button>
    </section>
  );
}
