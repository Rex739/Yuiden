# YuiDen Audit Report

Audit date: July 9, 2026

Scope: frontend build, dashboard smoke test, responsive checks, contract compile, contract/source inspection, HSP alignment review, AI Track fit, mock/simulation audit, README/submission readiness review.

Security boundary followed: no secret environment files were read or modified. Only `.env.example` was inspected.

## 1. Executive Summary

### Is YuiDen currently demoable?

Yes. The landing page and dashboard load locally, the dashboard remains a single-page product console, the AI agent action works, local fallback settlement creates visible receipts, and receipts remain visible after reload.

### Is it visually ready?

Yes for a hackathon MVP. The light-mode landing page, Rowdies typography, product carousel, dashboard console, mobile navigation, receipt cards/table, and transaction status UI are polished and coherent.

### Is it technically ready?

Mostly yes for a demo/testnet MVP. The root Next.js build passes, TypeScript checks pass, Hardhat contract compile passes, and the frontend no longer type-checks the Hardhat project from the root app build.

### Is it submission-ready?

Close, but README/submission materials need strengthening. The app itself is demo-ready. For a stronger submission, add a more complete README section set, a real-vs-simulated table, architecture diagram, demo script, and final deployment evidence.

### Is it mainnet-ready?

No. The Hardhat config currently includes HashKey testnet only. There is no mainnet network config, no mainnet deployment script, no production token strategy, no official HSP merchant/order API integration, and no security review/audit posture for production funds.

Final verdict: **Submission ready after mainnet deployment**.

## 2. Working Features

### Landing

- Loads at `/`.
- Logo links to `/`.
- Open Console CTA links to `/dashboard`.
- Product story carousel exists and is horizontally scrollable.
- No page-level horizontal overflow found at tested widths.

### Dashboard

- Loads at `/dashboard`.
- Stays a single-page console with local anchors for Overview, Meters, Agent, and Receipts.
- Mobile/tablet navigation uses a retractable Menu button.
- YuiDen logo links to `/`.
- Connect Wallet button appears.
- HSP status panel displays the current alignment note.
- No page-level horizontal overflow found at tested widths.

### Wallet

- Privy path exists in code through `@privy-io/react-auth` and `NEXT_PUBLIC_PRIVY_APP_ID`.
- If `NEXT_PUBLIC_PRIVY_APP_ID` is absent, the dashboard falls back to the injected EVM wallet path.
- Injected wallet fallback code still requests accounts, checks chain ID, can switch/add HashKey testnet, and can read MockUSDT balance/allowance.
- Local browser audit did not verify a real wallet signature or Privy login because no wallet interaction was authorized for this audit.

### Agent

- `Run YuiDen Agent` works in the browser smoke test.
- The agent selects producer/buyer route, matched kWh, dynamic price, zone, CO2 estimate, and confidence.
- Current AI behavior is deterministic rule-based logic over simulated meter data.

### Settlement

- Local fallback works without wallet connection.
- On-chain settlement path is preserved in source:
  - reads active chain ID,
  - checks HashKey testnet,
  - checks/mints demo MockUSDT when supported,
  - approves MockUSDT if needed,
  - calls `settleEnergy(producer, kwhScaled, amount, zone, co2SavedGrams)`.
- On-chain settlement was not executed in this audit because deployment values/wallet funding were not part of the task and secret files were not read.

### Receipts

- Local fallback receipt appears after executing HSP-aligned settlement without a wallet.
- Receipt table/card UI renders.
- Tx hash display exists as a compact explorer link/pill for on-chain receipts.
- Receipt table does not clip at tested desktop widths. At 768px the table container is horizontally scrollable as intended. On mobile the app uses receipt cards instead of the table.

### Persistence

- Latest visible receipt state survived browser reload in smoke test.
- Source inspection confirms `localStorage` stores `decision`, `receipts`, and `statusMessage` under `yuiden.dashboard.v1`.
- Receipt objects include optional HSP order and HSP receipt payloads.
- No clear/reset local console data control was found.
- Persisted data appears to be non-secret demo/user-facing state: decision, receipt metadata, public wallet-like addresses, transaction hash, and status text.

### Contracts

- `npx hardhat compile` passes from `contracts/`.
- `MockUSDT` exists.
- `YuiDenSettlement` exists.
- Deploy script exists for HashKey testnet.
- Frontend ABI names and function signatures match the Solidity contract shape.

## 3. Real vs Simulated Table

| Feature | Real or Simulated | Current implementation | Risk level | Suggested improvement |
| --- | --- | --- | --- | --- |
| Smart-meter data | Simulated | Static `houses` array in `lib/yuiden.ts` | Medium | Add API/import path for real meter readings or signed meter attestations. |
| Solar production | Simulated | Static `solarKwh` values | Medium | Connect to real device, CSV demo upload, or oracle/attestation source. |
| Energy consumption | Simulated | Static `consumptionKwh` values | Medium | Add live/recorded consumption feed. |
| House wallets | Simulated/demo | Static public-looking addresses in local data | Medium | Bind households to connected wallets or verified account registry. |
| AI matching | Simulated deterministic AI | Rule-based same-zone surplus/demand matching | Medium | Add forecast model, LLM explanation layer, or optimization scoring with tests. |
| Pricing | Simulated deterministic | JPY/kWh formula with scarcity/cross-zone adjustments | Medium | Add market-rate source, tariff policy, and explicit pricing assumptions. |
| FX conversion | Simulated fixed rate | `totalJPY / 156` in `lib/yuiden.ts` | Medium | Use real rate source or configurable server-side rate. |
| CO2 estimate | Simulated | `matchedKwh * 0.44` | Low/Medium | Cite factor and make it configurable by region/grid mix. |
| MockUSDT | Real contract, demo token | ERC20 demo token with faucet | Medium | Replace with approved production token strategy for mainnet. |
| HSP integration | Simulated/aligned only | Local HSP order/receipt types and payload lifecycle | High | Add official HSP merchant/order API adapter once credentials/endpoints are available. |
| HashKey Chain receipt | Real path, not re-executed in audit | `YuiDenSettlement.settleEnergy` writes receipt state/event on-chain | Medium | Provide verified testnet deployment evidence and event links. |
| Privy wallet | Real integration path, conditionally enabled | `PrivyProvider`, `usePrivy`, `useWallets` gated by public app id | Medium | Configure public app id in deployment and test full login/connect flow. |
| localStorage persistence | Real browser persistence | Stores dashboard decision, receipts, status | Low | Add visible reset/clear button and optional export. |
| Mainnet deployment | Missing | No mainnet Hardhat network/script | High | Add HashKey mainnet config, deployment checklist, and production runbook. |

## 4. HSP Alignment Status

### What exists

- `lib/hsp.ts` defines:
  - `HSPOrderStatus`
  - `HSPEnergyOrder`
  - `HSPReceiptPayload`
  - `createHSPEnergyOrder`
  - `createHSPReceiptPayload`
- Dashboard creates HSP-aligned orders/receipts for local fallback and on-chain settlement paths.
- Dashboard copy says: “Prepared for official HSP merchant/order integration. Current execution records HashKey Chain receipt settlement.”
- Landing/README use safer language such as “HSP-aligned” and “HSP-ready”.

### Claim safety

The project is safely positioned as **HSP-aligned** / **HSP-ready**, not falsely claiming full official HSP-powered integration.

### Missing official HSP integration

Official HSP merchant/order integration is not implemented. Missing pieces include:

- official merchant/app credential handling,
- official order creation endpoint/SDK,
- payment/order status synchronization,
- webhook verification,
- HSP order ID reconciliation with HashKey receipt hash,
- server-side adapter/API route for HSP calls,
- operational error handling for official HSP statuses.

### Files likely to change when official HSP access is available

- `lib/hsp.ts`: add official adapter request/response types and status mapping.
- New server-only API route, for example under `app/api/...`: create official HSP orders without exposing credentials to the browser.
- `app/dashboard/page.tsx`: call the server route and display official order/payment states.
- `.env.example`: add placeholders for HSP configuration only if they are safe placeholders.
- `README.md`: document official integration setup and demo flow.

### HSP env exposure status

No official HSP env placeholders are currently present. Future HSP merchant/app credentials must be server-only and must not use `NEXT_PUBLIC_`.

## 5. AI Track Fit

YuiDen clearly fits the AI Track at the MVP/demo level:

- AI agent decision layer exists via `runYuidenAgent`.
- Surplus and demand detection exists via `getSurplus` and `getDemand`.
- Matching logic prioritizes same-zone producer/buyer routes and strongest available balance.
- Pricing logic exists through a deterministic dynamic kWh formula.
- HSP-aligned order lifecycle exists through local order/receipt payloads.
- Settlement receipt generation exists locally and through the HashKey Chain contract path.

AI honesty:

- Current AI is **deterministic rule-based agent logic**.
- It is not currently LLM-powered.
- It is not currently an ML forecast model.
- The input data is simulated.

Recommended framing: “AI settlement agent / rule-based matching MVP with clear upgrade path to forecasting or LLM-assisted settlement operations.”

## 6. HashKey Chain Deployment Status

### Testnet

Status: implemented and compile-ready.

Evidence:

- Hardhat network `hashkeyTestnet` exists.
- Chain ID is `133`.
- RPC defaults to HashKey testnet public RPC when not provided.
- `contracts/scripts/deploy.ts` deploys `MockUSDT` and `YuiDenSettlement`.
- Frontend reads deployed addresses through public frontend env placeholders.
- README documents HashKey testnet setup and on-chain settlement flow.

Deployment/tested status:

- Source and README indicate testnet deployment works, but this audit did not read secret files and did not execute deployment or on-chain settlement.

### Mainnet

Status: missing.

Missing:

- HashKey mainnet network in Hardhat config.
- Mainnet deployment script or parameterized deploy script.
- Production token choice.
- Mainnet explorer URLs.
- Mainnet environment placeholder policy.
- Deployment checklist/runbook.
- Contract verification flow.
- Security review for real value transfer.

### Is the current contract enough for mainnet submission?

Enough for an MVP receipt/payment demonstration, not enough for production-grade mainnet funds without additional review. The contract transfers ERC20 payment from buyer to producer and records settlement metadata. It lacks production governance, pause/recovery controls, role-based integrations, official HSP reconciliation, dispute handling, and audit/security process.

## 7. Bugs / Risks Found

### Critical

- None found that block the local demo or build.

### High

- No HashKey mainnet config/deploy flow.
- Official HSP merchant/order integration is not implemented.
- Current AI is deterministic and uses simulated data, so claims must stay honest.
- Production token strategy is missing; MockUSDT is demo-only.

### Medium

- README is too thin for a strong hackathon submission.
- No visible “clear local console data” control even though dashboard state persists locally.
- Privy runtime flow was not fully verified with a configured app id and user wallet in this audit.
- On-chain settlement path was inspected and preserved, but not re-executed in this audit.
- Hardhat deploy script prints frontend env lines for convenience; keep this out of public logs when using real deployment processes.

### Low

- Browser console showed no captured errors during smoke tests.
- `punycode` deprecation warnings appeared during build/dev tooling, but they did not fail the build.
- Some landing text checks are case/layout dependent in browser automation, but the page loaded and primary sections were present.

## 8. Frontend/Responsive Findings

Tested widths:

| Width | Landing overflow | Dashboard overflow | Receipt behavior | Notes |
| --- | --- | --- | --- | --- |
| 1440px | No | No | Table fits | Dashboard menu button visible due current breakpoint strategy. |
| 1280px | No | No | Table fits | Cards are not cramped. |
| 1024px | No | No | Table fits | House cards remain wide enough. |
| 768px | No | No | Table container scrolls | Expected tablet behavior. |
| 430px | No | No | Mobile receipt cards | Mobile nav button visible. |
| 390px | No | No | Mobile receipt cards | Wallet button compact but readable. |
| 320px | No | No | Mobile receipt cards | No page-level horizontal overflow. |

Console errors: none captured during browser smoke checks.

## 9. README / Submission Checks

Current README includes:

- Project title: yes
- One-liner: yes
- Local setup: yes
- Testnet wallet/network setup: yes
- Contract compile instructions: yes
- Testnet deploy instructions: yes
- Local fallback demo flow: yes
- On-chain settlement demo flow: yes
- MVP scope: yes

Weak or missing for submission:

- Problem section
- Solution section
- Why Japan/post-FIT section
- Why HashKey Chain section
- Why HSP section
- AI Track positioning section
- Architecture section/diagram
- Contracts section with addresses/status
- Testnet deployment proof links
- Mainnet deployment placeholder/status
- Real vs simulated table
- Future roadmap
- Demo video script or judge walkthrough

Recommendation: do not rewrite the full README automatically unless requested, but add these sections before final submission.

## 10. Next Implementation Priorities

### P0 = must fix before submission

- Add strong README/submission sections: problem, solution, Japan context, HashKey Chain, HSP alignment, AI Track, architecture, real vs simulated, demo flow.
- Add deployment evidence: testnet contract addresses, explorer links, and transaction examples using placeholder-safe documentation.
- Decide whether the hackathon requires mainnet. If yes, add HashKey mainnet config and deployment runbook before submission.
- Add visible “Clear local console data” button for demo reliability.

### P1 = should fix to stand out

- Add official HSP-ready server adapter interface and route skeleton without credentials.
- Add a clearer AI explanation panel that shows why the agent selected a route.
- Add event/receipt lookup from `getSettlement` or emitted event data.
- Add README architecture diagram and short demo script.
- Add a small deterministic test suite for matching/pricing/HSP payload creation.

### P2 = nice to have

- Add CSV import or sample time-series meter playback.
- Add forecast mode for next-hour solar/demand.
- Add receipt export/download.
- Add dashboard reset/export controls.
- Add contract verification script and deployment checklist.

## 11. Recommended Next Codex Prompts

1. “Prepare YuiDen for HashKey mainnet deployment without deploying: add mainnet config placeholders, deployment checklist, verification notes, and keep secrets out of the repo.”

2. “Polish the YuiDen README for hackathon submission: add problem, solution, Japan post-FIT context, HashKey/HSP rationale, architecture, real-vs-simulated table, and demo flow.”

3. “Add an official HSP integration adapter skeleton using server-only config placeholders, but do not call real endpoints or expose credentials.”

4. “Write a 90-second YuiDen demo video script and judge walkthrough focused on AI Track, HSP alignment, HashKey Chain receipts, and real vs simulated honesty.”

## 12. Final Verdict

**Submission ready after mainnet deployment.**

YuiDen is demo-ready and visually strong. The root frontend build passes, contracts compile, dashboard smoke tests pass, responsive checks pass, and HSP language is appropriately careful. The biggest remaining gaps are mainnet deployment readiness, official HSP integration, and submission documentation polish.

