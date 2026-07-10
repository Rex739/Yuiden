import Link from "next/link";
import { ACTIVE_HASHKEY_CHAIN, hasContractConfig } from "@/lib/contracts";
import { HSP_ALIGNMENT_NOTE } from "@/lib/hsp";
import { ShellStat, StatusPill } from "@/components/dashboard/DashboardPrimitives";

export const dashboardNavItems = [
  ["Overview", "#overview"],
  ["Meters", "#meters"],
  ["Agent", "#agent"],
  ["Receipts", "#receipts"],
] as const;

type WalletButtonProps = {
  walletAddress: string;
  onConnectWallet: () => void;
};

function WalletButton({ walletAddress, onConnectWallet }: WalletButtonProps) {
  return (
    <button
      onClick={onConnectWallet}
      className="max-w-[9.5rem] truncate rounded-full bg-[#123D24] px-4 py-2.5 text-xs font-black text-[#9BE870] shadow-sm transition hover:bg-[#0D3500] hover:text-white sm:max-w-full sm:px-5 sm:text-sm"
    >
      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}

export function MobileTopBar({
  walletAddress,
  isMobileNavOpen,
  onConnectWallet,
  onOpenNav,
}: WalletButtonProps & {
  isMobileNavOpen: boolean;
  onOpenNav: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-[#FFFDF7]/92 px-3 py-3 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenNav}
            className="shrink-0 rounded-full bg-[#123D24] px-4 py-2.5 text-xs font-black uppercase text-[#9BE870] shadow-sm"
            aria-label="Open dashboard navigation"
            aria-expanded={isMobileNavOpen}
          >
            Menu
          </button>
          <Link href="/" className="[font-family:var(--font-rowdies)] text-2xl font-black tracking-tight">
            Yui<span className="text-[#20C997]">Den</span>
          </Link>
        </div>
        <WalletButton walletAddress={walletAddress} onConnectWallet={onConnectWallet} />
      </div>
    </div>
  );
}

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[#071A12]/35"
        onClick={onClose}
        aria-label="Close dashboard navigation"
      />
      <aside className="relative flex h-full w-[min(21rem,86vw)] flex-col border-r border-[#E5E7EB] bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="[font-family:var(--font-rowdies)] text-3xl font-black tracking-tight">
            Yui<span className="text-[#20C997]">Den</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#FFF3D1] text-lg font-black text-[#071A12]"
            aria-label="Close dashboard navigation"
          >
            x
          </button>
        </div>
        <p className="mt-3 text-sm font-bold leading-6 text-[#53645B]">AI energy settlement control room.</p>
        <nav className="mt-8 grid gap-2">
          {dashboardNavItems.map(([item, href], index) => (
            <a
              key={item}
              href={href}
              onClick={onClose}
              className={`rounded-full px-5 py-3 text-sm font-black ${
                index === 0 ? "bg-[#123D24] text-[#9BE870]" : "text-[#53645B] hover:bg-[#FFF3D1] hover:text-[#071A12]"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="mt-auto rounded-[2rem] bg-[#9BE870] p-5 text-[#071A12]">
          <p className="[font-family:var(--font-rowdies)] text-2xl font-black">HashKey Chain</p>
          <p className="mt-3 text-sm font-bold leading-6 text-[#123D24]/80">
            Settlement and receipt audit layer for local energy trades.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-64 shrink-0 rounded-[2.25rem] border border-[#E5E7EB] bg-white/90 p-5 shadow-soft backdrop-blur-xl lg:block xl:w-72">
      <Link href="/" className="[font-family:var(--font-rowdies)] text-3xl font-black tracking-tight">
        Yui<span className="text-[#20C997]">Den</span>
      </Link>
      <p className="mt-3 text-sm font-bold leading-6 text-[#53645B]">AI energy settlement control room.</p>
      <div className="mt-8 grid gap-2">
        {dashboardNavItems.map(([item, href], index) => (
          <a
            key={item}
            href={href}
            className={`rounded-full px-5 py-3 text-sm font-black ${
              index === 0 ? "bg-[#123D24] text-[#9BE870]" : "text-[#53645B] hover:bg-[#FFF3D1] hover:text-[#071A12]"
            }`}
          >
            {item}
          </a>
        ))}
      </div>
      <div className="mt-8 rounded-[2rem] bg-[#9BE870] p-5 text-[#071A12]">
        <p className="[font-family:var(--font-rowdies)] text-2xl font-black">HashKey Chain</p>
        <p className="mt-3 text-sm font-bold leading-6 text-[#123D24]/80">Settlement and receipt audit layer for local energy trades.</p>
      </div>
    </aside>
  );
}

export function DashboardHeader({
  chainId,
  walletAddress,
  isCorrectNetwork,
  onChainReady,
  needsAllowance,
  onConnectWallet,
  onSwitchNetwork,
}: {
  chainId: number | null;
  walletAddress: string;
  isCorrectNetwork: boolean;
  onChainReady: boolean;
  needsAllowance: boolean;
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
}) {
  return (
    <header className="mb-4 rounded-[1.5rem] border border-[#E5E7EB] bg-white/90 p-4 shadow-sm backdrop-blur-xl sm:mb-6 sm:rounded-[2.5rem] sm:p-6 sm:shadow-soft md:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2 sm:mb-5">
            <StatusPill tone={isCorrectNetwork ? "green" : "amber"}>
              {chainId ? (isCorrectNetwork ? ACTIVE_HASHKEY_CHAIN.chainName : "Wrong network") : "Network not connected"}
            </StatusPill>
            <StatusPill tone={hasContractConfig ? "green" : "amber"}>
              {hasContractConfig ? "Contracts configured" : "Local fallback active"}
            </StatusPill>
            <StatusPill tone={walletAddress ? "blue" : "amber"}>
              {walletAddress ? "Wallet connected" : "Wallet not connected"}
            </StatusPill>
            <StatusPill tone={walletAddress && hasContractConfig ? "green" : "amber"}>
              {onChainReady ? "On-chain receipt mode" : "Local receipt mode"}
            </StatusPill>
            <StatusPill tone={onChainReady && !needsAllowance ? "green" : "amber"}>
              {onChainReady ? (needsAllowance ? "Allowance needed" : "Allowance ready") : "Allowance not checked"}
            </StatusPill>
          </div>
          <h1 className="[font-family:var(--font-rowdies)] text-2xl font-black uppercase leading-[0.95] sm:text-5xl md:text-5xl">
            YUIDEN SETTLEMENT CONSOLE
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-[#53645B] sm:mt-5 sm:text-lg sm:leading-8">
            Monitor simulated Japanese smart meters, run the AI matching agent, and settle HSP-aligned energy
            receipts with local fallback reliability.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-3 xl:justify-end">
          {walletAddress && !isCorrectNetwork ? (
            <button
              onClick={onSwitchNetwork}
              className="max-w-full rounded-full bg-[#FFF3D1] px-5 py-3 text-sm font-black text-[#071A12] shadow-sm transition hover:bg-[#F6B73C] md:px-6 md:py-4"
            >
              Switch to HashKey
            </button>
          ) : null}
          <button
            onClick={onConnectWallet}
            className="hidden max-w-full truncate rounded-full bg-[#123D24] px-5 py-3 text-sm font-black text-[#9BE870] shadow-sm transition hover:bg-[#0D3500] hover:text-white md:inline-flex md:px-6 md:py-4"
          >
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </div>
    </header>
  );
}

export function SettlementStatusPanel({
  chainId,
  statusMessage,
  errorMessage,
  mockUsdtBalance,
  mockUsdtAllowance,
  needsAllowance,
  onChainReady,
  receiptsCount,
  onClearLocalConsoleData,
}: {
  chainId: number | null;
  statusMessage: string;
  errorMessage: string;
  mockUsdtBalance: string;
  mockUsdtAllowance: string;
  needsAllowance: boolean;
  onChainReady: boolean;
  receiptsCount: number;
  onClearLocalConsoleData: () => void;
}) {
  return (
    <section className="mb-6 rounded-[2rem] border border-[#E5E7EB] bg-white/90 p-4 shadow-soft backdrop-blur-xl sm:rounded-[2.25rem] sm:p-6">
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(34rem,auto)] 2xl:items-center">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase text-[#20C997]">Settlement mode</p>
          <p className="mt-2 break-words text-lg font-black leading-7 text-[#071A12] md:text-xl">{statusMessage}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#53645B]">{HSP_ALIGNMENT_NOTE}</p>
          {errorMessage ? <p className="mt-2 text-sm font-bold text-red-500">{errorMessage}</p> : null}
        </div>
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-3">
          <ShellStat label="Chain" value={chainId ? `${chainId}` : "Unknown"} />
          <ShellStat label="MockUSDT" value={mockUsdtBalance} />
          <ShellStat label="Allowance" value={needsAllowance ? "Needed" : mockUsdtAllowance} />
          <ShellStat label="Receipt mode" value={onChainReady ? "On-chain" : "Local"} />
          <ShellStat label="Receipts" value={`${receiptsCount}`} />
          <button
            type="button"
            onClick={onClearLocalConsoleData}
            className="min-w-0 rounded-2xl border-2 border-[#123D24] bg-white px-4 py-4 text-left text-xs font-black uppercase text-[#123D24] shadow-[0_0_0_3px_rgba(246,183,60,0.18)] transition hover:border-[#F6B73C] hover:bg-[#FFF3D1] hover:text-[#071A12] sm:px-5"
          >
            Clear local console data
          </button>
        </div>
      </div>
    </section>
  );
}
