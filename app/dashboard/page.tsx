"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { BrowserProvider, Contract, parseUnits } from "ethers";
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
  hasContractConfig,
} from "@/lib/contracts";
import {
  createHSPEnergyOrder,
  createHSPReceiptPayload,
  type HSPEnergyOrder,
  type HSPReceiptPayload,
} from "@/lib/hsp";
import type { AgentDecision, EnergyReceipt } from "@/lib/types";
import { getDemand, getSurplus, houses, runYuidenAgent } from "@/lib/yuiden";
import { DashboardHeader, DashboardSidebar, MobileNav, MobileTopBar, SettlementStatusPanel } from "@/components/dashboard/DashboardChrome";
import { HouseCard, MetricCard } from "@/components/dashboard/DashboardCards";
import { DecisionPanel, SettlementPanel } from "@/components/dashboard/DashboardPanels";
import { PrivyWalletBridge } from "@/components/dashboard/PrivyWalletBridge";
import { ReceiptTable } from "@/components/dashboard/ReceiptTable";
import type { EthereumProvider, EthereumProviderWithEvents } from "@/components/dashboard/types";
import {
  clearDashboardState,
  loadDashboardState,
  saveDashboardState,
} from "@/lib/dashboardPersistence";
import {
  createLocalHSPOrder,
  formatTokenAmount,
  getFriendlyError,
  getValidProducerAddress,
  placeholderReceipts,
  readTokenDecimals,
  tryMintDemoUsdt,
} from "@/lib/dashboardContracts";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

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

  // Persist only local console artifacts. Wallet and Privy session state stay owned by the wallet providers.
  useEffect(() => {
    if (!hasLoadedStoredState) return;

    if (!decision && receipts.length === 0 && statusMessage === "Local console data cleared.") {
      clearDashboardState();
      return;
    }

    saveDashboardState({ decision, receipts, statusMessage });
  }, [decision, hasLoadedStoredState, receipts, statusMessage]);

  // Keep injected-wallet reload/session state aligned without changing the existing Privy wallet bridge.
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

    // Preserve deterministic settlement execution: AI explains and scores, but the contract call records the receipt.
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

      <MobileTopBar
        walletAddress={walletAddress}
        isMobileNavOpen={isMobileNavOpen}
        onConnectWallet={handleConnectWallet}
        onOpenNav={() => setIsMobileNavOpen(true)}
      />
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      <div className="mx-auto flex max-w-[1600px] gap-4 px-3 py-4 sm:px-4 md:px-6 lg:gap-5 2xl:gap-6 2xl:px-8">
        <DashboardSidebar />

        <div className="min-w-0 flex-1">
          <DashboardHeader
            chainId={chainId}
            walletAddress={walletAddress}
            isCorrectNetwork={isCorrectNetwork}
            onChainReady={onChainReady}
            needsAllowance={needsAllowance}
            onConnectWallet={handleConnectWallet}
            onSwitchNetwork={handleSwitchNetwork}
          />

          <section id="overview" className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
            <MetricCard label="Network surplus" value={`${totals.surplus} kWh`} detail="Available local production" tone="solar" />
            <MetricCard label="Network demand" value={`${totals.demand} kWh`} detail="Open buyer demand" tone="sky" />
            <MetricCard label="Projected earnings" value={`¥${totals.monthlyJPY.toLocaleString()}`} detail="Monthly local estimate" tone="white" />
            <MetricCard label="CO2 saved estimate" value={`${totals.co2Saved} kg`} detail="Receipt-linked impact" tone="green" />
          </section>

          <SettlementStatusPanel
            chainId={chainId}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            mockUsdtBalance={mockUsdtBalance}
            mockUsdtAllowance={mockUsdtAllowance}
            needsAllowance={needsAllowance}
            onChainReady={onChainReady}
            receiptsCount={receipts.length}
            onClearLocalConsoleData={handleClearLocalConsoleData}
          />

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
