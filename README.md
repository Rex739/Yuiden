# YuiDen

AI settlement infrastructure for Japan's post-FIT solar communities.

YuiDen is an AI energy settlement agent for local renewable energy markets. It uses simulated smart-meter data, real Tokyo weather signals from Open-Meteo, and a custom YuiDen Agent pipeline to match surplus solar with nearby demand. The system prepares an HSP-aligned order and receipt lifecycle, then records settlement receipts on HashKey Chain. Optional server-side OpenAI reasoning explains the agent's recommendation, while deterministic matching and settlement execution remain the source of truth.

YuiDen is a hackathon MVP and mainnet proof, not production financial infrastructure.

## Problem

Japan's early feed-in tariff solar contracts are expiring, leaving many rooftop solar owners with weaker incentives for exported power. Post-FIT communities need better ways to coordinate local surplus, price small energy trades, and produce clear audit records for every settlement event.

Local renewable settlement needs three things at once:

- A trusted view of surplus and demand.
- Agent-readable settlement logic.
- Transparent receipts that communities, operators, and auditors can inspect.

YuiDen focuses on that settlement and audit layer. It does not claim physical energy delivery, utility-grid control, or real smart-meter hardware integration.

## Solution

YuiDen turns a local solar settlement moment into a structured order and receipt flow:

1. Simulated smart-meter data models household solar output, demand, battery level, and zone.
2. Open-Meteo provides a real Tokyo weather signal for solar and demand context.
3. The custom YuiDen Agent forecasts surplus and demand, scores locality, evaluates settlement readiness, and recommends a route.
4. Optional server-side OpenAI reasoning explains the recommendation in human-readable language.
5. An HSP-aligned order and receipt lifecycle prepares the flow for official HSP merchant/order integration.
6. HashKey Chain records the final settlement receipt as an auditable on-chain artifact.

The receipt links energy, value, carbon estimate, locality, status, and chain transaction data.

## Why Japan

Japan has dense urban energy demand, mature rooftop solar adoption, and a growing post-FIT market need. YuiDen is designed around small local renewable settlement moments: household-level surplus, nearby buyers, transparent receipts, and agent-assisted coordination.

## Why HashKey Chain

HashKey Chain gives YuiDen a public settlement record for each energy receipt. The MVP uses HashKey Chain for transparent receipt storage, low-cost smart contract execution, and mainnet proof that the settlement path can leave an auditable artifact.

Mainnet proof is already recorded on HashKey Chain.

## HSP Alignment

YuiDen models energy settlement as an HSP-ready order and receipt lifecycle:

- Draft an energy order from the agent decision.
- Prepare payment-request and payment-confirmation states.
- Record an HSP-aligned receipt payload.
- Preserve order IDs, merchant references, producer, buyer, amount, kWh, zone, carbon estimate, chain ID, and status.

Current MVP status:

- HashKey Chain receipt recording is implemented.
- HSP-aligned order and receipt models are implemented.
- Official HSP merchant/order integration is prepared but pending official credentials, endpoints, and merchant access.

YuiDen should be described as HSP-ready or HSP-aligned until official HSP merchant/order integration is live.

## AI Track Fit

YuiDen is an AI Track project because the product centers on a custom AI-agent pipeline for energy settlement:

- Open-Meteo weather signal for Tokyo solar context.
- Simulated smart-meter context for household production, demand, battery, and zone.
- Locality-aware matching between surplus producers and nearby buyers.
- Pricing and risk scoring for settlement readiness.
- A custom YuiDen Agent output with forecast, confidence, locality score, weather score, balance score, and settlement readiness score.
- Optional server-side OpenAI reasoning as an explanation layer.
- Deterministic settlement execution for verifiability.

OpenAI does not control the settlement transaction. The deterministic agent decision and contract execution remain the source of truth.

## Mainnet Proof

Network:

- HashKey Chain mainnet
- Chain ID: `177`
- Explorer: https://hashkey.blockscout.com

Contracts:

- MockUSDT demo token: `0x532951448Ad00659299b560001e0529659894fad`
- MockUSDT explorer: https://hashkey.blockscout.com/address/0x532951448Ad00659299b560001e0529659894fad
- YuiDenSettlement: `0x4031C90a4c856baE15EE660a8361B9Cf3Bf81541`
- YuiDenSettlement explorer: https://hashkey.blockscout.com/address/0x4031C90a4c856baE15EE660a8361B9Cf3Bf81541

Sample mainnet receipt:

- Transaction hash: `0x56f8fc3200d189813d93db9672f8064f696eef82481243ce3af0cb843c069533`
- Explorer: https://hsk.blockscout.com/tx/0x56f8fc3200d189813d93db9672f8064f696eef82481243ce3af0cb843c069533

This transaction demonstrates YuiDenSettlement receipt recording on HashKey Chain mainnet.

## Real vs Simulated

Real:

- HashKey Chain mainnet receipt transaction.
- YuiDenSettlement smart contract.
- MockUSDT demo token contract.
- Open-Meteo Tokyo weather signal.
- Custom YuiDen Agent scoring pipeline.
- Optional server-side OpenAI reasoning layer.
- Dashboard receipt persistence and local fallback mode.

Simulated or demo:

- Smart-meter data is simulated.
- Household identities and meter readings are simulated.
- Carbon estimate is modeled for the MVP.
- MockUSDT is a demo token, not a production payment asset.
- HSP merchant/order integration is prepared but not officially connected.

Not claimed:

- No physical energy delivery.
- No real smart-meter hardware integration.
- No production financial infrastructure.
- No completed official HSP merchant/order integration.

## Product Flow

1. Open the YuiDen console.
2. Run the YuiDen Agent.
3. Review the route, forecast, scoring, and explanation.
4. Execute HSP-aligned settlement.
5. Record an on-chain HashKey Chain receipt or create a local fallback receipt.
6. Inspect receipt status, transaction hash, and settlement metadata.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- GSAP animations
- Ethers
- Privy/injected EVM wallet path
- Hardhat
- Solidity
- Open-Meteo Forecast API
- Optional server-side OpenAI reasoning
- HashKey Chain

## Local Development

Install and run the frontend:

```bash
npm install
npm run dev
```

Open:

- Landing page: `http://localhost:3000`
- Console: `http://localhost:3000/dashboard`

Compile contracts:

```bash
cd contracts
npm install
npx hardhat compile
```

Use `.env.example` files for placeholder guidance only. Never commit real private keys, wallet secrets, API keys, or merchant credentials.

## Related Docs

- Mainnet evidence: `docs/DEPLOYMENT_EVIDENCE.md`
- Mainnet checklist: `docs/MAINNET_DEPLOYMENT_CHECKLIST.md`
- Audit report: `docs/YUIDEN_AUDIT_REPORT.md`
- Hackathon submission brief: `docs/HACKATHON_SUBMISSION.md`
