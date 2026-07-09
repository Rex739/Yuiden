"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { BrowserProvider, Contract, formatUnits, getAddress, isAddress, parseUnits, ZeroAddress } from "ethers";
import { mockUsdtAbi, yuidenSettlementAbi } from "@/lib/contractAbi";
import {
  ACTIVE_HASHKEY_CHAIN,
  ACTIVE_PRIVY_HASHKEY_CHAIN,
  HASHKEY_CHAIN_ID,
  HASHKEY_CHAIN_ID_HEX,
  HASHKEY_RPC_URL,
  MOCK_USDT_ADDRESS,
  PRIVY_HASHKEY_CHAINS,
  YUIDEN_SETTLEMENT_ADDRESS,
  getTxExplorerUrl,
  hasContractConfig,
} from "@/lib/contracts";
import {
  HSP_ALIGNMENT_NOTE,
  createHSPEnergyOrder,
  createHSPReceiptPayload,
  type HSPEnergyOrder,
  type HSPReceiptPayload,
} from "@/lib/hsp";
import type { AgentDecision, EnergyReceipt, HouseMeter } from "@/lib/types";
import { getDemand, getSurplus, houses, runYuidenAgent } from "@/lib/yuiden";

const DASHBOARD_STORAGE_KEY = "yuiden.dashboard.v1";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

const dashboardNavItems = [
  ["Overview", "#overview"],
  ["Meters", "#meters"],
  ["Agent", "#agent"],
  ["Receipts", "#receipts"],
] as const;

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type EthereumProviderWithEvents = EthereumProvider & {
  on?: (event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function DashboardPage() {
  if (!PRIVY_APP_ID) {
    return <DashboardConsole privyEnabled={false} />;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        supportedChains: PRIVY_HASHKEY_CHAINS,
        defaultChain: ACTIVE_PRIVY_HASHKEY_CHAIN,
      }}
    >
      <DashboardConsole privyEnabled />
    </PrivyProvider>
  );
}

function DashboardConsole({ privyEnabled }: { privyEnabled: boolean }) {
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [receipts, setReceipts] = useState<EnergyReceipt[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [privyProvider, setPrivyProvider] = useState<EthereumProvider | null>(null);
  const [privyConnect, setPrivyConnect] = useState<(() => void) | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [mockUsdtBalance, setMockUsdtBalance] = useState("Not checked");
  const [mockUsdtAllowance, setMockUsdtAllowance] = useState("Not checked");
  const [needsAllowance, setNeedsAllowance] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Wallet not connected - using local fallback receipt mode.");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);

  const isCorrectNetwork = chainId === HASHKEY_CHAIN_ID;
  const onChainReady = Boolean(walletAddress && hasContractConfig && isCorrectNetwork);
  const activeProvider = privyProvider ?? (typeof window !== "undefined" ? window.ethereum : undefined);

  const totals = useMemo(() => {
    const monthlyJPY = receipts.reduce((sum, receipt) => sum + receipt.totalJPY, 0) * 30 || 18420;
    const co2Saved = receipts.reduce((sum, receipt) => sum + receipt.co2SavedKg, 0) || 5.02;

    return {
      monthlyJPY,
      co2Saved: Number(co2Saved.toFixed(2)),
      surplus: Number(houses.reduce((sum, house) => sum + getSurplus(house), 0).toFixed(1)),
      demand: Number(houses.reduce((sum, house) => sum + getDemand(house), 0).toFixed(1)),
    };
  }, [receipts]);

  async function handleRunAgent() {
    setErrorMessage("");
    setIsAgentRunning(true);
    setStatusMessage("YuiDen Agent is checking Tokyo weather and preparing deterministic settlement values...");

    try {
      const response = await fetch("/api/agent", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Agent route unavailable");
      }

      const payload = (await response.json()) as { decision?: AgentDecision };

      if (!payload.decision) {
        throw new Error("Agent route returned no decision");
      }

      setDecision(payload.decision);
      setStatusMessage("YuiDen Agent prepared a weather-aware HSP-aligned settlement flow.");
    } catch {
      const nextDecision = runYuidenAgent(houses);
      setDecision(nextDecision);
      setStatusMessage("Weather-aware reasoning unavailable - deterministic HSP-aligned settlement flow prepared.");
    } finally {
      setIsAgentRunning(false);
    }
  }

  useEffect(() => {
    const savedState = loadDashboardState();

    if (savedState) {
      setDecision(savedState.decision);
      setReceipts(savedState.receipts);
      setStatusMessage(savedState.statusMessage);
    }

    setHasLoadedStoredState(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredState) return;

    if (!decision && receipts.length === 0 && statusMessage === "Local console data cleared.") {
      clearDashboardState();
      return;
    }

    saveDashboardState({ decision, receipts, statusMessage });
  }, [decision, hasLoadedStoredState, receipts, statusMessage]);

  useEffect(() => {
    if (!window.ethereum || privyProvider) return;

    async function syncInitialWallet() {
      if (!window.ethereum) return;

      try {
        const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
        const account = accounts[0] || "";
        setWalletAddress(account);
        await refreshWalletState(account);
        if (account) {
          setStatusMessage(
            hasContractConfig
              ? "Wallet session restored. HashKey Chain receipt settlement is available when readiness checks pass."
              : "Wallet session restored, but contract addresses are missing - local fallback remains active.",
          );
        }
      } catch {
        await refreshWalletState();
      }
    }

    syncInitialWallet();

    const ethereum = window.ethereum as EthereumProviderWithEvents;
    const handleAccountsChanged = (accounts: unknown) => {
      const [account] = Array.isArray(accounts) ? (accounts as string[]) : [];
      setWalletAddress(account || "");
      if (account) {
        refreshWalletState(account);
        setStatusMessage("Wallet session updated.");
      } else {
        setMockUsdtBalance("Not checked");
        setMockUsdtAllowance("Not checked");
        setNeedsAllowance(false);
        setStatusMessage("Wallet disconnected - using local fallback receipt mode.");
      }
    };
    const handleChainChanged = () => {
      refreshWalletState();
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [decision?.totalUSDT, privyProvider]);

  const handlePrivyWalletReady = useCallback(async (address: string, provider: EthereumProvider) => {
    setPrivyProvider(provider);
    setWalletAddress(address);
    await refreshWalletState(address, provider);
    setStatusMessage(
      hasContractConfig
        ? "Privy wallet connected. HashKey Chain receipt settlement is available when readiness checks pass."
        : "Privy wallet connected, but contract addresses are missing - local fallback remains active.",
    );
  }, []);

  const handlePrivyWalletDisconnected = useCallback(() => {
    setPrivyProvider(null);
    setWalletAddress("");
    setChainId(null);
    setMockUsdtBalance("Not checked");
    setMockUsdtAllowance("Not checked");
    setNeedsAllowance(false);
    setStatusMessage("Wallet disconnected - using local fallback receipt mode.");
  }, []);

  const handlePrivyConnectReady = useCallback((connect: (() => void) | null) => {
    setPrivyConnect(connect ? () => connect : null);
  }, []);

  async function handleConnectWallet() {
    setErrorMessage("");

    if (privyEnabled && privyConnect) {
      privyConnect();
      return;
    }

    if (!activeProvider) {
      setErrorMessage("No browser wallet found. Install MetaMask or another EVM wallet to settle on-chain.");
      return;
    }

    try {
      const accounts = (await activeProvider.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts[0]) {
        const connectedAddress = accounts[0];
        setWalletAddress(connectedAddress);
        await refreshWalletState(connectedAddress, activeProvider);
        setStatusMessage(
          hasContractConfig
            ? "Wallet connected. HashKey Chain receipt settlement is enabled when MockUSDT is available."
            : "Wallet connected, but contract addresses are missing - local fallback remains active.",
        );
      }
    } catch (error) {
      setErrorMessage(getFriendlyError(error));
    }
  }

  async function ensureHashKeyNetwork(provider: EthereumProvider) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HASHKEY_CHAIN_ID_HEX }],
      });
    } catch (error) {
      const switchError = error as { code?: number };

      if (switchError.code !== 4902) {
        throw error;
      }

      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HASHKEY_CHAIN_ID_HEX,
            chainName: ACTIVE_HASHKEY_CHAIN.chainName,
            nativeCurrency: ACTIVE_HASHKEY_CHAIN.nativeCurrency,
            rpcUrls: [HASHKEY_RPC_URL],
            blockExplorerUrls: ACTIVE_HASHKEY_CHAIN.blockExplorerUrls,
          },
        ],
      });
    }
  }

  async function handleSwitchNetwork() {
    setErrorMessage("");

    if (!activeProvider) {
      setErrorMessage("No browser wallet found. Install MetaMask or another EVM wallet to settle on-chain.");
      return;
    }

    try {
      setStatusMessage(`Requesting ${ACTIVE_HASHKEY_CHAIN.chainName} in wallet...`);
      await ensureHashKeyNetwork(activeProvider);
      await refreshWalletState(walletAddress, activeProvider);
      setStatusMessage(`${ACTIVE_HASHKEY_CHAIN.chainName} is active.`);
    } catch (error) {
      setErrorMessage(getFriendlyError(error));
      setStatusMessage(`Wrong network - switch to ${ACTIVE_HASHKEY_CHAIN.chainName} for on-chain settlement.`);
    }
  }

  async function readChainId(provider: EthereumProvider) {
    const chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
    return Number(BigInt(chainIdHex));
  }

  async function refreshWalletState(account = walletAddress, providerOverride?: EthereumProvider) {
    const providerSource = providerOverride ?? activeProvider;
    if (!providerSource) return;

    try {
      const activeChainId = await readChainId(providerSource);
      setChainId(activeChainId);

      if (!account || !hasContractConfig || activeChainId !== HASHKEY_CHAIN_ID) {
        setMockUsdtBalance(account ? "Unavailable" : "Not checked");
        setMockUsdtAllowance(account ? "Unavailable" : "Not checked");
        setNeedsAllowance(false);
        return;
      }

      const provider = new BrowserProvider(providerSource);
      const token = new Contract(MOCK_USDT_ADDRESS, mockUsdtAbi, provider);
      const decimals = await readTokenDecimals(token);
      const balance = (await token.balanceOf(account)) as bigint;
      const allowance = (await token.allowance(account, YUIDEN_SETTLEMENT_ADDRESS)) as bigint;
      const expectedAmount = parseUnits((decision?.totalUSDT ?? 0).toString(), decimals);

      setMockUsdtBalance(`${formatTokenAmount(balance, decimals)} USDT`);
      setMockUsdtAllowance(`${formatTokenAmount(allowance, decimals)} USDT`);
      setNeedsAllowance(expectedAmount > BigInt(0) && allowance < expectedAmount);
    } catch (error) {
      setMockUsdtBalance("Unavailable");
      setMockUsdtAllowance("Unavailable");
      setNeedsAllowance(false);
    }
  }

  function createLocalReceipt(activeDecision: AgentDecision, message: string) {
    setStatusMessage(message);
    const hspOrder = createLocalHSPOrder(activeDecision);
    const hspReceipt = createHSPReceiptPayload({ order: hspOrder, status: "receipt_recorded" });
    addReceipt(activeDecision, "local", undefined, hspOrder, hspReceipt);
  }

  function addReceipt(
    activeDecision: AgentDecision,
    status: EnergyReceipt["status"],
    txHash?: string,
    hspOrder?: HSPEnergyOrder,
    hspReceipt?: HSPReceiptPayload,
  ) {
    setReceipts((current) => [
      {
        id:
          status === "onchain" && txHash
            ? `YDN-${txHash.slice(2, 8).toUpperCase()}`
            : `YDN-${String(current.length + 1).padStart(4, "0")}`,
        producerName: activeDecision.producerName,
        buyerName: activeDecision.buyerName,
        matchedKwh: activeDecision.matchedKwh,
        totalJPY: activeDecision.totalJPY,
        totalUSDT: activeDecision.totalUSDT,
        zone: activeDecision.zone,
        co2SavedKg: activeDecision.co2SavedKg,
        timestamp: new Date().toLocaleString("en-JP", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Tokyo",
        }),
        txHash,
        status,
        hspOrder,
        hspReceipt,
      },
      ...current,
    ]);
  }

  function handleCreateLocalFallback() {
    const activeDecision = decision ?? runYuidenAgent(houses);
    setDecision(activeDecision);
    setErrorMessage("");
    createLocalReceipt(activeDecision, "Local fallback receipt created.");
  }

  function handleClearLocalConsoleData() {
    setDecision(null);
    setReceipts([]);
    setErrorMessage("");
    setStatusMessage("Local console data cleared.");
    clearDashboardState();
  }

  async function handleSettlement() {
    const activeDecision = decision ?? runYuidenAgent(houses);

    setDecision(activeDecision);
    setErrorMessage("");

    if (!activeProvider || !walletAddress) {
      createLocalReceipt(activeDecision, "Wallet not connected - creating local fallback receipt.");
      return;
    }

    if (!hasContractConfig) {
      createLocalReceipt(activeDecision, "Contract addresses missing - creating local fallback receipt.");
      return;
    }

    const producer = houses.find((house) => house.id === activeDecision.producerId);

    if (!producer) {
      createLocalReceipt(activeDecision, "Producer wallet missing - creating local fallback receipt.");
      return;
    }

    setIsSettling(true);
    setStatusMessage("Preparing HashKey Chain settlement...");

    try {
      const activeChainId = await readChainId(activeProvider);
      setChainId(activeChainId);

      if (activeChainId !== HASHKEY_CHAIN_ID) {
        setStatusMessage(`Wrong network - switch to ${ACTIVE_HASHKEY_CHAIN.chainName} for on-chain settlement.`);
        setErrorMessage(`Local fallback remains available until the wallet is on ${ACTIVE_HASHKEY_CHAIN.chainName}.`);
        return;
      }

      const provider = new BrowserProvider(activeProvider);
      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();
      const token = new Contract(MOCK_USDT_ADDRESS, mockUsdtAbi, signer);
      const settlement = new Contract(YUIDEN_SETTLEMENT_ADDRESS, yuidenSettlementAbi, signer);
      const producerAddress = getValidProducerAddress(producer.wallet, buyerAddress);

      if (!producerAddress) {
        createLocalReceipt(activeDecision, "Producer wallet is not eligible for on-chain settlement - creating local fallback receipt.");
        return;
      }

      const hspOrder = createHSPEnergyOrder({
        decision: activeDecision,
        producer: producerAddress,
        buyer: buyerAddress,
        chainId: activeChainId,
        status: "payment_requested",
      });

      const tokenDecimals = await readTokenDecimals(token);
      const amount = parseUnits(activeDecision.totalUSDT.toString(), tokenDecimals);
      const kwhScaled = BigInt(Math.round(activeDecision.matchedKwh * 1000));
      const co2SavedGrams = BigInt(Math.round(activeDecision.co2SavedKg * 1000));
      let balance = (await token.balanceOf(buyerAddress)) as bigint;

      if (balance < amount) {
        setStatusMessage("Connected wallet needs demo USDT. Trying MockUSDT mint flow...");
        const minted = await tryMintDemoUsdt(token, buyerAddress, amount);
        balance = (await token.balanceOf(buyerAddress)) as bigint;

        if (!minted || balance < amount) {
          setErrorMessage(
            "Connected wallet has no demo USDT. Use deployer wallet or mint/transfer MockUSDT before on-chain settlement.",
          );
          setStatusMessage("MockUSDT balance is too low - local fallback remains available.");
          setMockUsdtBalance(`${formatTokenAmount(balance, tokenDecimals)} USDT`);
          setMockUsdtAllowance("Not checked");
          return;
        }
      }

      const allowance = (await token.allowance(buyerAddress, YUIDEN_SETTLEMENT_ADDRESS)) as bigint;
      setMockUsdtBalance(`${formatTokenAmount(balance, tokenDecimals)} USDT`);
      setMockUsdtAllowance(`${formatTokenAmount(allowance, tokenDecimals)} USDT`);
      setNeedsAllowance(allowance < amount);

      if (allowance < amount) {
        setStatusMessage("Approval pending - confirm MockUSDT spend in wallet...");
        const approveTx = await token.approve(YUIDEN_SETTLEMENT_ADDRESS, amount);
        await approveTx.wait();
        setMockUsdtAllowance(`${formatTokenAmount(amount, tokenDecimals)} USDT`);
        setNeedsAllowance(false);
      }

      setStatusMessage("Settlement pending - submitting HSP-aligned energy receipt to HashKey Chain...");
      const tx = await settlement.settleEnergy(producerAddress, kwhScaled, amount, activeDecision.zone, co2SavedGrams);
      const receipt = await tx.wait();
      const txHash = receipt?.hash ?? tx.hash;
      const hspReceipt = createHSPReceiptPayload({ order: hspOrder, txHash, status: "receipt_recorded" });

      addReceipt(activeDecision, "onchain", txHash, hspOrder, hspReceipt);
      setStatusMessage(`On-chain receipt created on ${ACTIVE_HASHKEY_CHAIN.chainName}.`);
      await refreshWalletState(buyerAddress, activeProvider);
    } catch (error) {
      const friendlyError = getFriendlyError(error);
      setErrorMessage(friendlyError);
      setStatusMessage("On-chain settlement failed - local fallback remains available.");
    } finally {
      setIsSettling(false);
    }
  }

  const displayReceipts = receipts.length ? receipts : placeholderReceipts;

  return (
    <main className="min-h-screen bg-[#FFFDF7] text-[#071A12]">
      <div className="fixed inset-0 -z-10 bg-grid opacity-55" />
      <div className="fixed left-0 top-0 -z-10 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(155,232,112,0.30),transparent_66%)] blur-3xl" />
      <div className="fixed right-0 top-24 -z-10 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(246,183,60,0.18),transparent_66%)] blur-3xl" />

      {privyEnabled ? (
        <PrivyWalletBridge
          onConnectReady={handlePrivyConnectReady}
          onDisconnected={handlePrivyWalletDisconnected}
          onWalletReady={handlePrivyWalletReady}
        />
      ) : null}

      <div className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-[#FFFDF7]/92 px-3 py-3 backdrop-blur-xl 2xl:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
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
          <button
            onClick={handleConnectWallet}
            className="max-w-[9.5rem] truncate rounded-full bg-[#123D24] px-4 py-2.5 text-xs font-black text-[#9BE870] shadow-sm transition hover:bg-[#0D3500] hover:text-white sm:max-w-full sm:px-5 sm:text-sm"
          >
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 2xl:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-[#071A12]/35"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close dashboard navigation"
          />
          <aside className="relative flex h-full w-[min(21rem,86vw)] flex-col border-r border-[#E5E7EB] bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="[font-family:var(--font-rowdies)] text-3xl font-black tracking-tight">
                Yui<span className="text-[#20C997]">Den</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
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
                  onClick={() => setIsMobileNavOpen(false)}
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
      ) : null}

      <div className="mx-auto flex max-w-[1600px] gap-6 px-3 py-4 sm:px-4 md:px-6 2xl:px-8">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-72 shrink-0 rounded-[2.25rem] border border-[#E5E7EB] bg-white/90 p-5 shadow-soft backdrop-blur-xl 2xl:block">
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

        <div className="min-w-0 flex-1">
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
                <h1 className="[font-family:var(--font-rowdies)] text-2xl font-black uppercase leading-[0.95] sm:text-5xl md:text-7xl">
                  YUIDEN SETTLEMENT CONSOLE
                </h1>
                <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-[#53645B] sm:mt-5 sm:text-lg sm:leading-8">
                  Monitor simulated Japanese smart meters, run the AI matching agent, and settle HSP-aligned energy
                  receipts with local fallback reliability.
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap gap-3">
                {walletAddress && !isCorrectNetwork ? (
                  <button
                    onClick={handleSwitchNetwork}
                    className="max-w-full rounded-full bg-[#FFF3D1] px-5 py-3 text-sm font-black text-[#071A12] shadow-sm transition hover:bg-[#F6B73C] md:px-6 md:py-4"
                  >
                    Switch to HashKey
                  </button>
                ) : null}
                <button
                  onClick={handleConnectWallet}
                  className="hidden max-w-full truncate rounded-full bg-[#123D24] px-5 py-3 text-sm font-black text-[#9BE870] shadow-sm transition hover:bg-[#0D3500] hover:text-white md:px-6 md:py-4 2xl:inline-flex"
                >
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
                </button>
              </div>
            </div>
          </header>

          <section id="overview" className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
            <MetricCard label="Network surplus" value={`${totals.surplus} kWh`} detail="Available local production" tone="solar" />
            <MetricCard label="Network demand" value={`${totals.demand} kWh`} detail="Open buyer demand" tone="sky" />
            <MetricCard label="Projected earnings" value={`¥${totals.monthlyJPY.toLocaleString()}`} detail="Monthly local estimate" tone="white" />
            <MetricCard label="CO2 saved estimate" value={`${totals.co2Saved} kg`} detail="Receipt-linked impact" tone="green" />
          </section>

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
                <ShellStat label="Receipts" value={`${receipts.length}`} />
                <button
                  type="button"
                  onClick={handleClearLocalConsoleData}
                  className="min-w-0 rounded-2xl border-2 border-[#123D24] bg-white px-4 py-4 text-left text-xs font-black uppercase text-[#123D24] shadow-[0_0_0_3px_rgba(246,183,60,0.18)] transition hover:border-[#F6B73C] hover:bg-[#FFF3D1] hover:text-[#071A12] sm:px-5"
                >
                  Clear local console data
                </button>
              </div>
            </div>
          </section>

          <section id="meters" className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
            {houses.map((house) => (
              <HouseCard key={house.id} house={house} />
            ))}
          </section>

          <section id="agent" className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.03fr)_minmax(36rem,0.97fr)]">
            <div className="grid gap-6">
              <DecisionPanel decision={decision} isAgentRunning={isAgentRunning} onRunAgent={handleRunAgent} />
              <SettlementPanel
                decision={decision}
                walletAddress={walletAddress}
                isCorrectNetwork={isCorrectNetwork}
                mockUsdtBalance={mockUsdtBalance}
                needsAllowance={needsAllowance}
                isSettling={isSettling}
                onSettlement={handleSettlement}
                onLocalFallback={handleCreateLocalFallback}
              />
            </div>
            <ReceiptTable receipts={displayReceipts} liveCount={receipts.length} />
          </section>
        </div>
      </div>
    </main>
  );
}

function PrivyWalletBridge({
  onConnectReady,
  onDisconnected,
  onWalletReady,
}: {
  onConnectReady: (connect: (() => void) | null) => void;
  onDisconnected: () => void;
  onWalletReady: (address: string, provider: EthereumProvider) => void | Promise<void>;
}) {
  const { ready, authenticated, connectWallet, login } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();

  useEffect(() => {
    if (!ready) {
      onConnectReady(null);
      return;
    }

    onConnectReady(() => {
      if (!authenticated) {
        login();
        return;
      }

      connectWallet();
    });
  }, [authenticated, connectWallet, login, onConnectReady, ready]);

  useEffect(() => {
    let cancelled = false;

    async function syncWallet() {
      if (!ready || !walletsReady || !authenticated) return;

      const wallet = wallets.find((item) => item.address);
      if (!wallet) {
        onDisconnected();
        return;
      }

      try {
        const provider = await wallet.getEthereumProvider();
        if (!cancelled) {
          await onWalletReady(wallet.address, provider as EthereumProvider);
        }
      } catch {
        if (!cancelled) {
          onDisconnected();
        }
      }
    }

    syncWallet();

    return () => {
      cancelled = true;
    };
  }, [authenticated, onDisconnected, onWalletReady, ready, wallets, walletsReady]);

  return null;
}

function MetricCard({
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

function HouseCard({ house }: { house: HouseMeter }) {
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

function DecisionPanel({
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

function SettlementPanel({
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

function ReceiptTable({ receipts, liveCount }: { receipts: EnergyReceipt[]; liveCount: number }) {
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

function TxHashPill({ txHash }: { txHash: string }) {
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

function StatusPill({ tone, children }: { tone: "green" | "amber" | "blue" | "white"; children: ReactNode }) {
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

function ShellStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF7] px-4 py-4 sm:px-5">
      <p className="text-xs font-bold text-[#53645B]">{label}</p>
      <p className="mt-1 break-words [font-family:var(--font-rowdies)] text-lg font-black sm:text-xl">{value}</p>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF7] p-4 sm:p-5">
      <span className="text-sm font-bold text-[#53645B]">{label}</span>
      <p className="mt-2 break-words [font-family:var(--font-rowdies)] text-xl font-black text-[#071A12] sm:text-2xl">{value}</p>
    </div>
  );
}

function ReceiptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-3">
      <p className="text-[10px] font-black uppercase text-[#53645B]">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-[#071A12]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-bold text-white/55">{label}</p>
      <p className="mt-2 [font-family:var(--font-rowdies)] text-xl font-black">{value}</p>
    </div>
  );
}

function Bar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
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

async function readTokenDecimals(token: Contract) {
  try {
    const decimals = await token.decimals();
    return Number(decimals);
  } catch {
    return 18;
  }
}

function formatTokenAmount(amount: bigint, decimals: number) {
  const formatted = formatUnits(amount, decimals);
  const numeric = Number(formatted);

  if (!Number.isFinite(numeric)) {
    return formatted;
  }

  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

async function tryMintDemoUsdt(token: Contract, account: string, amount: bigint) {
  try {
    const faucetTx = await token.faucet(account);
    await faucetTx.wait();
    return true;
  } catch {
    try {
      const mintTx = await token.mint(account, amount);
      await mintTx.wait();
      return true;
    } catch {
      return false;
    }
  }
}

function getValidProducerAddress(candidate: string, buyerAddress: string) {
  const normalizedBuyer = getAddress(buyerAddress);

  if (isAddress(candidate)) {
    const producer = getAddress(candidate);

    if (producer !== ZeroAddress && producer.toLowerCase() !== normalizedBuyer.toLowerCase()) {
      return producer;
    }
  }

  const fallbackProducer = houses.find((house) => {
    if (!isAddress(house.wallet)) return false;

    const producer = getAddress(house.wallet);
    return producer !== ZeroAddress && producer.toLowerCase() !== normalizedBuyer.toLowerCase();
  });

  return fallbackProducer ? getAddress(fallbackProducer.wallet) : null;
}

type PersistedDashboardState = {
  decision: AgentDecision | null;
  receipts: EnergyReceipt[];
  statusMessage: string;
};

function loadDashboardState(): PersistedDashboardState | null {
  if (typeof window === "undefined") return null;

  try {
    const rawState = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!rawState) return null;

    const parsed = JSON.parse(rawState) as Partial<PersistedDashboardState>;

    return {
      decision: parsed.decision ?? null,
      receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
      statusMessage:
        typeof parsed.statusMessage === "string"
          ? parsed.statusMessage
          : "Wallet not connected - using local fallback receipt mode.",
    };
  } catch {
    return null;
  }
}

function saveDashboardState(state: PersistedDashboardState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is helpful for the demo, but local fallback should keep working without it.
  }
}

function clearDashboardState() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
  } catch {
    // Clearing local demo state should never interrupt wallet or settlement readiness.
  }
}

function createLocalHSPOrder(activeDecision: AgentDecision) {
  const producer = houses.find((house) => house.id === activeDecision.producerId);
  const buyer = houses.find((house) => house.id === activeDecision.buyerId);

  return createHSPEnergyOrder({
    decision: activeDecision,
    producer: producer?.wallet ?? "local-producer",
    buyer: buyer?.wallet ?? "local-buyer",
    chainId: HASHKEY_CHAIN_ID,
    status: "receipt_recorded",
  });
}

const placeholderReceipts: EnergyReceipt[] = [
  {
    id: "YDN-PREV",
    producerName: "Sakura House",
    buyerName: "Kumo Residence",
    matchedKwh: 11.4,
    totalJPY: 313,
    totalUSDT: 2.01,
    zone: "Tokyo-East",
    co2SavedKg: 5.02,
    timestamp: "Preview receipt",
    status: "local",
  },
];

function getFriendlyError(error: unknown) {
  const errorLike = error as { code?: string | number; reason?: string; shortMessage?: string; message?: string };
  const message = errorLike.shortMessage || errorLike.reason || errorLike.message;

  if (errorLike.code === 4001 || errorLike.code === "ACTION_REJECTED") {
    return "Wallet action was rejected.";
  }

  if (message) {
    if (message.toLowerCase().includes("user rejected") || message.toLowerCase().includes("rejected")) {
      return "Wallet action was rejected.";
    }

    if (message.toLowerCase().includes("insufficient funds")) {
      return "Wallet has insufficient gas funds for the configured HashKey network.";
    }

    if (message.toLowerCase().includes("missing revert data")) {
      return "The settlement contract rejected the transaction. Check MockUSDT balance, allowance, and contract addresses.";
    }

    return message.length > 160 ? `${message.slice(0, 157)}...` : message;
  }

  if (error instanceof Error && error.message) {
    if (error.message.includes("user rejected")) {
      return "Wallet action was rejected.";
    }

    if (error.message.includes("insufficient funds")) {
      return "Wallet has insufficient gas funds for the configured HashKey network.";
    }

    return error.message.length > 160 ? `${error.message.slice(0, 157)}...` : error.message;
  }

  return "Something went wrong while preparing the on-chain settlement.";
}
