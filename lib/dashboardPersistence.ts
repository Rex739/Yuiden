import type { AgentDecision, EnergyReceipt } from "@/lib/types";

export const DASHBOARD_STORAGE_KEY = "yuiden.dashboard.v1";

export type PersistedDashboardState = {
  decision: AgentDecision | null;
  receipts: EnergyReceipt[];
  statusMessage: string;
};

export function loadDashboardState(): PersistedDashboardState | null {
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

export function saveDashboardState(state: PersistedDashboardState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is helpful for the demo, but local fallback should keep working without it.
  }
}

export function clearDashboardState() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
  } catch {
    // Clearing local demo state should never interrupt wallet or settlement readiness.
  }
}
