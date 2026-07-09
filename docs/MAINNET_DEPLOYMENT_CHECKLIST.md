# Mainnet Deployment Checklist

This checklist documents the public deployment process for YuiDen on HashKey Chain mainnet.

## Pre-Deploy Checklist

- Confirm `npx hardhat compile` passes from `contracts/`.
- Use a dedicated burner deployer wallet.
- Fund the deployer with a small HSK gas balance only.
- Never use a main wallet private key.
- Confirm `hashkeyMainnet` is selected intentionally before deploying.
- Confirm `MockUSDT` is used only as a demo token for hackathon proof.
- Confirm official HSP merchant integration is still HSP-ready and pending credentials.

## Deploy Steps

Compile:

```bash
cd contracts
npx hardhat compile
```

Optional testnet deployment:

```bash
npx hardhat run scripts/deploy.ts --network hashkeyTestnet
```

Mainnet deployment:

```bash
npx hardhat run scripts/deploy.ts --network hashkeyMainnet
```

## Post-Deploy Checks

- Record the deployed `MockUSDT` address.
- Record the deployed `YuiDenSettlement` address.
- Open both contract addresses in the HashKey explorer.
- Confirm chain ID is `177`.
- Confirm the deployer wallet paid gas successfully.
- Run a small receipt settlement demo only with demo funds/token assumptions.

## Public Frontend Configuration Checklist

Use public deployment values only. Do not add server-only secrets to public documentation.

```env
NEXT_PUBLIC_MOCK_USDT_ADDRESS=
NEXT_PUBLIC_YUIDEN_SETTLEMENT_ADDRESS=
NEXT_PUBLIC_HASHKEY_CHAIN_ID=177
NEXT_PUBLIC_HASHKEY_RPC_URL=https://mainnet.hsk.xyz
NEXT_PUBLIC_HASHKEY_EXPLORER_URL=https://hashkey.blockscout.com
NEXT_PUBLIC_PRIVY_APP_ID=
```

Server-only AI and official HSP merchant credentials, if used later, must remain in private deployment secret storage and outside public docs.

## Submission Evidence Checklist

- Mainnet `MockUSDT` contract address.
- Mainnet `YuiDenSettlement` contract address.
- Explorer links for both contracts.
- Sample receipt transaction link.
- Screenshot of dashboard on mainnet config.
- Demo video link.
- Notes explaining that `MockUSDT` is a demo token and YuiDen is not production financial infrastructure.
