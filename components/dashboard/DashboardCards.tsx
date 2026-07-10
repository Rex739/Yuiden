import type { HouseMeter } from "@/lib/types";
import { getDemand, getSurplus } from "@/lib/yuiden";
import { Bar } from "@/components/dashboard/DashboardPrimitives";

export function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "solar" | "sky" | "green" | "white";
}) {
  const toneClass =
    tone === "solar"
      ? "bg-[#FFF3D1]"
      : tone === "green"
        ? "bg-[#9BE870]"
        : tone === "sky"
          ? "bg-[#E8FFF6]"
          : "bg-white";

  return (
    <article className={`min-h-44 min-w-0 rounded-[2rem] border border-[#E5E7EB] p-5 shadow-sm sm:p-6 ${toneClass}`}>
      <p className="text-sm font-black uppercase text-[#53645B]">{label}</p>
      <p className="mt-5 [font-family:var(--font-rowdies)] text-4xl font-black leading-none text-[#071A12]">{value}</p>
      <p className="mt-4 text-sm font-bold text-[#53645B]">{detail}</p>
    </article>
  );
}

export function HouseCard({ house }: { house: HouseMeter }) {
  const surplus = getSurplus(house);
  const demand = getDemand(house);
  const status = surplus > 0 ? "Surplus" : demand > 0 ? "Demand" : "Balanced";
  const statusTone = surplus > 0 ? "bg-[#9BE870] text-[#071A12]" : demand > 0 ? "bg-[#FFF3D1] text-[#071A12]" : "bg-[#E8FFF6] text-[#20C997]";
  const batteryPct = Math.round((house.batteryKwh / house.maxBatteryKwh) * 100);
  const solarPct = Math.min(Math.round((house.solarKwh / 20) * 100), 100);
  const consumptionPct = Math.min(Math.round((house.consumptionKwh / 20) * 100), 100);

  return (
    <article className="min-w-0 rounded-[2rem] border border-[#E5E7EB] bg-white/92 p-5 shadow-sm backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#FFF3D1] [font-family:var(--font-rowdies)] text-lg font-black text-[#123D24]">
          {house.name.slice(0, 2).toUpperCase()}
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusTone}`}>{status}</span>
      </div>
      <h2 className="[font-family:var(--font-rowdies)] text-2xl font-black leading-none">{house.name}</h2>
      <p className="mt-2 text-sm font-bold text-[#53645B]">{house.zone}</p>
      <p className="mt-5 break-all rounded-2xl bg-[#FFFDF7] px-3 py-3 text-[11px] font-bold text-[#53645B]">{house.wallet}</p>
      <div className="mt-5 space-y-5">
        <Bar label="Solar" value={`${house.solarKwh} kWh`} pct={solarPct} color="bg-[#F6B73C]" />
        <Bar label="Demand" value={`${house.consumptionKwh} kWh`} pct={consumptionPct} color="bg-[#38BDF8]" />
        <Bar label="Battery" value={`${house.batteryKwh}/${house.maxBatteryKwh}`} pct={batteryPct} color="bg-[#20C997]" />
      </div>
    </article>
  );
}
