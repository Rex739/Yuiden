# YuiDen

YuiDen is an HSP-aligned AI settlement layer for Japan's post-FIT solar communities.

It simulates smart-meter data from local Japanese solar homes, matches surplus solar producers with nearby demand, calculates dynamic kWh pricing, and creates HSP-aligned settlement orders with HashKey Chain receipts.

## Run Frontend Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the landing page and `http://localhost:3000/dashboard` for the settlement console.

Create `.env.local` from `.env.example` after contracts are deployed. Use deployed contract addresses for the first two values:

```env
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_HASHKEY_CHAIN_ID=133
NEXT_PUBLIC_HASHKEY_RPC_URL=https://testnet.hsk.xyz
NEXT_PUBLIC_HASHKEY_EXPLORER_URL=https://hashkeychain-testnet-explorer.alt.technology
NEXT_PUBLIC_PRIVY_APP_ID=
```

Restart `npm run dev` after changing frontend environment variables.

## Connect MetaMask To HashKey Chain Testnet

The dashboard can request the network switch automatically. If you add it manually in MetaMask, use:

- Network name: `HashKey Chain Testnet`
- Chain ID: `133`
- Currency symbol: `HSK`
- RPC URL: `https://testnet.hsk.xyz`
- Block explorer: `https://hashkeychain-testnet-explorer.alt.technology`

## Compile Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

## Deploy To HashKey Chain Testnet

Create `contracts/.env` from `contracts/.env.example` with local placeholder guidance, then add the required deployment values privately.

Deploy:

```bash
cd contracts
npm run deploy:hashkey
```

The deploy script prints:

```txt
NEXT_PUBLIC_MOCK_USDT_ADDRESS=...
NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS=...
NEXT_PUBLIC_HASHKEY_CHAIN_ID=133
NEXT_PUBLIC_HASHKEY_RPC_URL=https://testnet.hsk.xyz
NEXT_PUBLIC_HASHKEY_EXPLORER_URL=https://hashkeychain-testnet-explorer.alt.technology
```

Copy those values into the frontend `.env.local`, then restart `npm run dev`.

## HashKey Chain Mainnet Deployment

YuiDen mainnet deployment is completed on HashKey Chain. This deployment is for hackathon proof and receipt demonstration, not production financial operation.

- Network: `HashKey Chain`
- Chain ID: `177`
- RPC URL: `https://mainnet.hsk.xyz`
- Explorer: `https://hashkey.blockscout.com`

Mainnet contracts:

- MockUSDT demo token: `0x532951448Ad00659299b560001e0529659894fad`
- MockUSDT explorer: https://hashkey.blockscout.com/address/0x532951448Ad00659299b560001e0529659894fad
- YuiDenSettlement: `0x4031C90a4c856baE15EE660a8361B9Cf3Bf81541`
- YuiDenSettlement explorer: https://hashkey.blockscout.com/address/0x4031C90a4c856baE15EE660a8361B9Cf3Bf81541

Sample mainnet receipt proof:

- Transaction hash: `0x56f8fc3200d189813d93db9672f8064f696eef82481243ce3af0cb843c069533`
- Explorer link: https://hsk.blockscout.com/tx/0x56f8fc3200d189813d93db9672f8064f696eef82481243ce3af0cb843c069533
- Proof note: The sample transaction demonstrates YuiDenSettlement receipt recording on HashKey Chain mainnet.

Real-vs-simulated scope:

- `MockUSDT` is a demo token for settlement flow testing and hackathon proof.
- The on-chain receipt path is real on HashKey Chain mainnet.
- Smart-meter inputs are simulated for the MVP.
- Official HSP merchant integration is HSP-ready and pending official credentials, endpoints, and merchant/order access. YuiDen should not be described as fully HSP-powered until that official integration is live.

Safety checklist:

- Use a dedicated burner deployer wallet.
- Fund it with only a small HSK gas balance.
- Never use a main wallet private key.
- Never commit or print real private keys.
- Keep official HSP merchant integration marked as HSP-ready until credentials and endpoints are available.
- Remember that `MockUSDT` is a demo token, not a production payment asset.

Compile contracts:

```bash
cd contracts
npx hardhat compile
```

Deploy to HashKey Chain testnet:

```bash
npx hardhat run scripts/deploy.ts --network hashkeyTestnet
```

Deploy to HashKey Chain mainnet:

```bash
npx hardhat run scripts/deploy.ts --network hashkeyMainnet
```

For this completed mainnet deployment, configure the frontend deployment environment with the public contract values:

```env
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x532951448Ad00659299b560001e0529659894fad
NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS=0x4031C90a4c856baE15EE660a8361B9Cf3Bf81541
NEXT_PUBLIC_HASHKEY_CHAIN_ID=177
NEXT_PUBLIC_HASHKEY_RPC_URL=https://mainnet.hsk.xyz
NEXT_PUBLIC_HASHKEY_EXPLORER_URL=https://hashkey.blockscout.com
```

Save explorer proof links for both deployed contracts:

```txt
https://hashkey.blockscout.com/address/{contractAddress}
```

## Test Local Fallback

Local fallback should work before any wallet or contract setup:

1. Open `/dashboard`.
2. Click `Run YuiDen Agent`.
3. Click `Execute HSP-Aligned Settlement` without connecting a wallet, or click `Create Local Fallback Receipt`.
4. Confirm a receipt appears with the `Local fallback` badge.

Local fallback remains available when the wallet is disconnected, contract addresses are missing, the wallet is on the wrong network, MockUSDT balance is unavailable, or a wallet transaction is rejected.

## Test On-Chain Settlement

1. Add deployed values for `NEXT_PUBLIC_MOCK_USDT_ADDRESS` and `NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS` to `.env.local`.
2. Restart the frontend dev server.
3. Open `/dashboard`.
4. Connect MetaMask.
5. Switch to HashKey Chain Testnet if prompted.
6. Click `Run YuiDen Agent`.
7. Click `Execute HSP-Aligned Settlement`.
8. Confirm any required MockUSDT mint/faucet transaction if the token supports it.
9. Confirm MockUSDT approval if allowance is below the settlement amount.
10. Confirm the `settleEnergy(producer, kwhScaled, amount, zone, co2SavedGrams)` transaction.

If the transaction succeeds, the receipt is added with an `On-chain` badge and a HashKey explorer transaction link:

```txt
https://hashkeychain-testnet-explorer.alt.technology/tx/{txHash}
```

If MockUSDT cannot be minted automatically, use a wallet that already has demo USDT or transfer/mint MockUSDT before retrying settlement.

## MVP Scope

- Next.js App Router, TypeScript, Tailwind CSS
- GSAP landing animations
- Local mock data
- Frontend works before contract deployment with local fallback
- Hardhat contracts in `contracts/contracts`
- MockUSDT demo payment token
- YuiDenSettlement on-chain energy receipt settlement contract
