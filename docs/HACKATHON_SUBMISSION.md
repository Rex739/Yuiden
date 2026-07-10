# YuiDen Hackathon Submission Brief

## Project

YuiDen is an AI settlement infrastructure project for Japan's post-FIT solar communities.

## Track

AI Track

## One-Liner

YuiDen uses simulated smart-meter data, real Tokyo weather signals, and a custom AI agent to prepare HSP-aligned energy settlement receipts on HashKey Chain.

## What It Does

YuiDen models a local renewable energy settlement workflow. It identifies households with surplus solar, matches them with nearby demand, scores the settlement route, prepares an HSP-aligned order and receipt lifecycle, and records the receipt on HashKey Chain.

The product is designed as an agent-assisted settlement layer, not a grid-control system or physical energy delivery platform.

## AI Layer

The custom YuiDen Agent pipeline includes:

- Weather-aware forecasting from Open-Meteo Tokyo data.
- Simulated smart-meter context for solar output, demand, battery state, and zone.
- Locality-aware matching between producer and buyer.
- Pricing and settlement readiness scoring.
- Confidence, locality, weather, balance, and settlement readiness scores.
- Optional server-side OpenAI reasoning for explanation only.
- Deterministic settlement execution for verifiable receipts.

OpenAI explains the recommendation but does not control the settlement transaction.

## HSP Alignment

YuiDen is HSP-ready and HSP-aligned. It models energy settlement as an order and receipt lifecycle that can be connected to official HSP merchant/order infrastructure when credentials and endpoints are available.

Current MVP status:

- HSP-aligned order and receipt models are implemented.
- HashKey Chain receipt recording is implemented.
- Official HSP merchant/order integration is pending official credentials, endpoints, and access.

YuiDen does not claim completed official HSP integration.

## HashKey Chain Mainnet Proof

Network:

- HashKey Chain mainnet
- Chain ID: `177`

Contracts:

- MockUSDT demo token: `0x532951448Ad00659299b560001e0529659894fad`
- MockUSDT explorer: https://hashkey.blockscout.com/address/0x532951448Ad00659299b560001e0529659894fad
- YuiDenSettlement: `0x4031C90a4c856baE15EE660a8361B9Cf3Bf81541`
- YuiDenSettlement explorer: https://hashkey.blockscout.com/address/0x4031C90a4c856baE15EE660a8361B9Cf3Bf81541

Sample receipt:

- Transaction hash: `0x56f8fc3200d189813d93db9672f8064f696eef82481243ce3af0cb843c069533`
- Explorer: https://hsk.blockscout.com/tx/0x56f8fc3200d189813d93db9672f8064f696eef82481243ce3af0cb843c069533

This transaction demonstrates YuiDenSettlement receipt recording on HashKey Chain mainnet.

## Real vs Simulated

Real:

- HashKey Chain mainnet receipt recording.
- Deployed YuiDenSettlement contract.
- Deployed MockUSDT demo token.
- Open-Meteo Tokyo weather signal.
- Custom YuiDen Agent pipeline.
- Optional server-side OpenAI reasoning.

Simulated or demo:

- Smart-meter readings.
- Household energy profiles.
- Local producer and buyer identities.
- Carbon savings estimate.
- MockUSDT as a demo payment token.

Not claimed:

- Physical energy delivery.
- Real smart-meter hardware integration.
- Production financial infrastructure.
- Completed official HSP merchant/order integration.

## Why It Matters

Post-FIT solar communities need clearer local settlement and audit infrastructure. YuiDen shows how AI agents, weather context, HSP-ready settlement modeling, and HashKey Chain receipts can work together to make local renewable energy exchange more transparent and verifiable.
