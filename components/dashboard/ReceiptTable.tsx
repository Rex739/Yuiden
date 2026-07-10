import type { EnergyReceipt } from "@/lib/types";
import { ReceiptMetric, StatusPill, TxHashPill } from "@/components/dashboard/DashboardPrimitives";

export function ReceiptTable({ receipts, liveCount }: { receipts: EnergyReceipt[]; liveCount: number }) {
  return (
    <section id="receipts" className="min-w-0 rounded-[2rem] border border-[#E5E7EB] bg-white/92 p-4 shadow-soft backdrop-blur sm:rounded-[2.5rem] sm:p-7">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase text-[#F6B73C]">Audit records</p>
          <h2 className="mt-2 [font-family:var(--font-rowdies)] text-3xl font-black uppercase leading-none sm:text-4xl">Energy receipts</h2>
        </div>
        <span className="w-fit rounded-full bg-[#E8FFF6] px-4 py-2 text-sm font-black text-[#20C997]">{liveCount} live receipts</span>
      </div>

      <div className="grid gap-3 md:hidden">
        {receipts.map((receipt) => (
          <article key={receipt.id} className="min-w-0 rounded-[1.5rem] border border-[#E5E7EB] bg-[#FFFDF7] p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="[font-family:var(--font-rowdies)] text-lg font-black">{receipt.id}</p>
              <StatusPill tone={receipt.status === "onchain" ? "green" : "white"}>
                {receipt.status === "onchain" ? "On-chain" : "Local fallback"}
              </StatusPill>
            </div>
            <p className="break-words text-base font-black leading-6">
              {receipt.producerName} &rarr; {receipt.buyerName}
            </p>
            <p className="mt-1 break-words text-xs font-bold leading-5 text-[#53645B]">
              {receipt.zone} | {receipt.timestamp}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <ReceiptMetric label="kWh" value={`${receipt.matchedKwh}`} />
              <ReceiptMetric label="JPY" value={`¥${receipt.totalJPY}`} />
              <ReceiptMetric label="CO2" value={`${receipt.co2SavedKg} kg`} />
            </div>
            {receipt.status === "onchain" && receipt.txHash ? (
              <div className="mt-4">
                <TxHashPill txHash={receipt.txHash} />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden w-full max-w-full overflow-x-auto rounded-[2rem] border border-[#E5E7EB] bg-[#FFFDF7] p-3 md:block">
        <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left text-sm xl:min-w-[980px]">
          <thead className="text-[#53645B]">
            <tr>
              <th className="w-[8rem] px-4 py-2">ID</th>
              <th className="min-w-[16rem] px-4 py-2">Route</th>
              <th className="w-[5rem] px-4 py-2">kWh</th>
              <th className="w-[5rem] px-4 py-2">JPY</th>
              <th className="w-[6rem] px-4 py-2">CO2</th>
              <th className="w-[10rem] px-4 py-2">Status</th>
              <th className="w-[12rem] px-4 py-2">Tx hash</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id} className="bg-white shadow-sm">
                <td className="rounded-l-2xl px-5 py-5 [font-family:var(--font-rowdies)] text-lg font-black">{receipt.id}</td>
                <td className="min-w-[16rem] px-4 py-4">
                  <span className="block break-words font-black leading-6">
                    {receipt.producerName} &rarr; {receipt.buyerName}
                  </span>
                  <p className="mt-1 break-words text-xs font-bold leading-5 text-[#53645B]">
                    {receipt.zone} | {receipt.timestamp}
                  </p>
                </td>
                <td className="px-4 py-4 font-bold">{receipt.matchedKwh}</td>
                <td className="px-4 py-4 font-bold">¥{receipt.totalJPY}</td>
                <td className="px-4 py-4 font-bold">{receipt.co2SavedKg} kg</td>
                <td className="px-4 py-4">
                  <StatusPill tone={receipt.status === "onchain" ? "green" : "white"}>
                    {receipt.status === "onchain" ? "On-chain" : "Local fallback"}
                  </StatusPill>
                </td>
                <td className="rounded-r-2xl px-4 py-4">
                  {receipt.status === "onchain" && receipt.txHash ? (
                    <TxHashPill txHash={receipt.txHash} />
                  ) : (
                    <span className="inline-flex rounded-full bg-[#FFF3D1] px-3 py-1.5 text-xs font-black text-[#53645B]">
                      Local only
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
