"use client";

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { EthereumProvider } from "@/components/dashboard/types";

export function PrivyWalletBridge({
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
