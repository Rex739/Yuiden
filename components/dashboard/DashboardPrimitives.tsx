import type { ReactNode } from "react";
import { getTxExplorerUrl } from "@/lib/contracts";

export function TxHashPill({ txHash }: { txHash: string }) {
  return (
    <a
      href={getTxExplorerUrl(txHash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full rounded-full bg-[#E8FFF6] px-3 py-1.5 text-xs font-black text-[#20C997] transition hover:bg-[#9BE870] hover:text-[#071A12]"
      title="Open HashKey Chain explorer"
    >
      <span className="truncate">
        {txHash.slice(0, 6)}...{txHash.slice(-6)}
      </span>
    </a>
  );
}

export function StatusPill({ tone, children }: { tone: "green" | "amber" | "blue" | "white"; children: ReactNode }) {
  const toneClass =
    tone === "green"
      ? "bg-[#9BE870] text-[#071A12]"
      : tone === "blue"
        ? "bg-[#123D24] text-[#9BE870]"
        : tone === "white"
          ? "bg-white text-[#53645B]"
          : "bg-[#FFF3D1] text-[#071A12]";

  return <span className={`w-fit max-w-full rounded-full px-4 py-2 text-xs font-black ${toneClass}`}>{children}</span>;
}

export function ShellStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF7] px-4 py-4 sm:px-5">
      <p className="text-xs font-bold text-[#53645B]">{label}</p>
      <p className="mt-1 break-words [font-family:var(--font-rowdies)] text-lg font-black sm:text-xl">{value}</p>
    </div>
  );
}

export function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF7] p-4 sm:p-5">
      <span className="text-sm font-bold text-[#53645B]">{label}</span>
      <p className="mt-2 break-words [font-family:var(--font-rowdies)] text-xl font-black text-[#071A12] sm:text-2xl">{value}</p>
    </div>
  );
}

export function ReceiptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-3">
      <p className="text-[10px] font-black uppercase text-[#53645B]">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-[#071A12]">{value}</p>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-bold text-white/55">{label}</p>
      <p className="mt-2 [font-family:var(--font-rowdies)] text-xl font-black">{value}</p>
    </div>
  );
}

export function Bar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-[#53645B]">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 rounded-full bg-[#E5E7EB]">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
