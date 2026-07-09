const metrics = [
  ["Network surplus", "24.7 kWh", "bg-paleSolar text-deep"],
  ["Network demand", "16.3 kWh", "bg-white text-deep"],
  ["AI match confidence", "94%", "bg-paleGreen text-energy"],
  ["Settlement amount", "¥313", "bg-white text-deep"],
  ["CO2 saved", "5.0 kg", "bg-paleGreen text-energy"],
  ["Receipt status", "On-chain ready", "bg-sky/15 text-sky"],
];

export default function PremiumDashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#27563A] bg-[#0B2518] p-4 text-white shadow-[0_28px_90px_rgba(7,26,18,0.34)] md:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(246,183,60,0.18),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(32,201,151,0.13),transparent_34%)]" />
      <div className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase text-sky">YuiDen Console</p>
            <h3 className="mt-2 text-2xl font-black">Tokyo-East settlement run</h3>
          </div>
          <span className="w-fit rounded-full bg-energy px-4 py-2 text-sm font-black text-deep">HashKey Testnet</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {metrics.map(([label, value, tone]) => (
            <div key={label} className={`rounded-2xl border border-white/10 p-4 ${tone}`}>
              <p className="text-xs font-bold opacity-70">{label}</p>
              <p className="mt-3 text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white p-4 text-deep">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black text-muted">Recommended route</p>
              <p className="mt-2 text-xl font-black">Sakura House &rarr; Kumo Residence</p>
            </div>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-soft md:max-w-xs">
              <div className="h-full w-[94%] rounded-full bg-energy" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
