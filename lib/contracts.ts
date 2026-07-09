export const HASHKEY_TESTNET = {
  chainId: 133,
  chainIdHex: "0x85",
  chainName: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: ["https://testnet.hsk.xyz"],
  blockExplorerUrls: ["https://hashkeychain-testnet-explorer.alt.technology"],
} as const;

export const HASHKEY_MAINNET = {
  chainId: 177,
  chainIdHex: "0xb1",
  chainName: "HashKey Chain",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: ["https://mainnet.hsk.xyz"],
  blockExplorerUrls: ["https://hashkey.blockscout.com"],
} as const;

export const HASHKEY_CHAINS = [HASHKEY_TESTNET, HASHKEY_MAINNET] as const;
export const PRIVY_HASHKEY_CHAINS = HASHKEY_CHAINS.map((chain) => ({
  id: chain.chainId,
  name: chain.chainName,
  network: chain.chainName.toLowerCase().replaceAll(" ", "-"),
  nativeCurrency: chain.nativeCurrency,
  rpcUrls: {
    default: { http: chain.rpcUrls },
    public: { http: chain.rpcUrls },
  },
  blockExplorers: {
    default: {
      name: "HashKey Explorer",
      url: chain.blockExplorerUrls[0],
    },
  },
}));

export const HASHKEY_CHAIN_ID = Number(process.env.NEXT_PUBLIC_HASHKEY_CHAIN_ID || HASHKEY_TESTNET.chainId);
export const ACTIVE_HASHKEY_CHAIN =
  HASHKEY_CHAINS.find((chain) => chain.chainId === HASHKEY_CHAIN_ID) ?? HASHKEY_TESTNET;
export const ACTIVE_PRIVY_HASHKEY_CHAIN =
  PRIVY_HASHKEY_CHAINS.find((chain) => chain.id === ACTIVE_HASHKEY_CHAIN.chainId) ?? PRIVY_HASHKEY_CHAINS[0];
export const HASHKEY_CHAIN_ID_HEX = ACTIVE_HASHKEY_CHAIN.chainIdHex;
export const HASHKEY_RPC_URL =
  process.env.NEXT_PUBLIC_HASHKEY_RPC_URL || ACTIVE_HASHKEY_CHAIN.rpcUrls[0];
export const HASHKEY_EXPLORER_URL =
  process.env.NEXT_PUBLIC_HASHKEY_EXPLORER_URL || ACTIVE_HASHKEY_CHAIN.blockExplorerUrls[0];

export const MOCK_USDT_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS || "";
export const YUIDEN_SETTLEMENT_ADDRESS =
  process.env.NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS || "";

export const hasContractConfig = Boolean(MOCK_USDT_ADDRESS && YUIDEN_SETTLEMENT_ADDRESS);

export function getTxExplorerUrl(txHash: string) {
  return `${HASHKEY_EXPLORER_URL}/tx/${txHash}`;
}
