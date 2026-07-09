"use client";

export default function HeroVisual() {
  return (
    <div className="hero-visual relative mx-auto w-full max-w-[34rem] overflow-hidden rounded-[2rem] border border-soft bg-white shadow-[0_30px_90px_rgba(16,32,51,0.16)]">
      <div className="relative overflow-hidden rounded-t-[2rem] bg-[linear-gradient(135deg,#0D3500,#1B5E20_45%,#20C997)] p-7 text-white">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative">
          <p className="text-sm font-black uppercase text-[#9BE870]">YuiDen settlement desk</p>
          <h3 className="mt-3 max-w-sm text-4xl font-black leading-[0.95] text-[#9BE870]">
            Match surplus sunlight locally
          </h3>
          <div className="mt-6 rounded-3xl bg-white p-4 text-deep">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-paleSolar font-black">SA</span>
                <div>
                  <p className="font-black">Sakura House</p>
                  <p className="text-sm font-bold text-muted">Producer | +17.1 kWh</p>
                </div>
              </div>
              <span className="rounded-full bg-paleGreen px-3 py-1 text-sm font-black text-energy">Solar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-7">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-black text-muted">
            <span>Buyer receives</span>
            <span>Tokyo-East</span>
          </div>
          <div className="flex items-center justify-between rounded-3xl bg-background px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-sky/20 font-black text-sky">KU</span>
              <span className="font-black">Kumo Residence</span>
            </div>
            <span className="[font-family:var(--font-rowdies)] text-3xl font-black text-deep">11.4</span>
          </div>
        </div>

        <svg className="h-16 w-full" viewBox="0 0 520 74" role="img" aria-label="Energy flow route">
          <path
            className="energy-line"
            d="M20 37 C126 8 168 66 260 37 C352 8 394 66 500 37"
            fill="none"
            stroke="#F6B73C"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <circle cx="260" cy="37" r="22" fill="#102033" />
          <path d="M251 37h18M260 28v18" stroke="#9BE870" strokeLinecap="round" strokeWidth="4" />
        </svg>

        <div className="grid gap-3">
          <HeroRow label="Dynamic price" value="¥27.5/kWh" />
          <HeroRow label="HSP-aligned order" value="2.01 mUSDT" />
          <HeroRow label="CO2 saved" value="5.02 kg" />
        </div>

        <button className="w-full rounded-full bg-[#9BE870] px-6 py-4 font-black text-deep">
          Generate HashKey receipt
        </button>
      </div>
    </div>
  );
}

function HeroRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-soft pt-3">
      <span className="font-bold text-muted">{label}</span>
      <span className="font-black text-deep">{value}</span>
    </div>
  );
}
