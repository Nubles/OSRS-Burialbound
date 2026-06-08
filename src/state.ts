import { HistoryEntry, Rite, RunState } from "./types";

export const STORAGE_KEY = "burialbound-state-v1";

export const defaultRunState: RunState = {
  runName: "Grave Ledger",
  pendingRites: [],
  memorialArchive: [],
  breachNotes: [],
  history: [],
  strictMode: true
};

export function createHistory(title: string, detail: string): HistoryEntry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    title,
    detail
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function hydrateRite(rite: Rite): Rite {
  return {
    ...rite,
    completedOfferings: Array.isArray(rite.completedOfferings) ? rite.completedOfferings : [],
    completedClauses: Array.isArray(rite.completedClauses) ? rite.completedClauses : []
  };
}

export function loadRunState(): RunState {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return defaultRunState;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRunState;
    const parsed = JSON.parse(raw) as Partial<RunState>;
    return {
      ...defaultRunState,
      ...parsed,
      pendingRites: Array.isArray(parsed.pendingRites) ? parsed.pendingRites.map(hydrateRite) : [],
      memorialArchive: Array.isArray(parsed.memorialArchive) ? parsed.memorialArchive.map(hydrateRite) : [],
      breachNotes: Array.isArray(parsed.breachNotes) ? parsed.breachNotes : [],
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return defaultRunState;
  }
}

export function saveRunState(state: RunState): void {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be blocked in strict privacy modes; the app should still run.
  }
}
