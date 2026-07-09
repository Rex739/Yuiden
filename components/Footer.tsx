import Link from "next/link";

const productLinks = [
  ["Problem", "#problem"],
  ["How it Works", "#how"],
  ["Console", "#demo"],
  ["Receipts", "#receipts"],
];

const buildLinks = [
  ["Dashboard", "/dashboard"],
  ["Contracts", "#receipts"],
  ["HashKey Testnet", "#receipts"],
];

export default function Footer() {
  return (
    <footer className="border-t border-soft/80 bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.5fr_0.8fr_0.8fr_1fr]">
        <div>
          <Link href="/" className="[font-family:var(--font-rowdies)] text-2xl font-black">
            Yui<span className="text-solar">Den</span>
          </Link>
          <p className="mt-4 max-w-sm leading-7 text-muted">
            AI-native settlement infrastructure for local renewable energy markets, designed for Japan&apos;s post-FIT
            solar communities.
          </p>
        </div>
        <FooterColumn title="Product" links={productLinks} />
        <FooterColumn title="Build" links={buildLinks} />
        <div>
          <p className="text-sm font-black uppercase text-muted">Hackathon note</p>
          <p className="mt-4 rounded-3xl border border-soft bg-background p-5 font-bold leading-7 text-deep">
            Originally developed for the HSK Chain Japan Hackathon as a transparent settlement and audit layer, not a
            utility-grid replacement.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="text-sm font-black uppercase text-muted">{title}</p>
      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className="font-bold text-deep/80 transition hover:text-deep">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
