import { getTemplate, pickFromPool, STARTER_RITES, TIER_RULES, templateForType } from "./data/rites";
import { BreachRecord, HistoryEntry, Rite, RunState, UnlockTier, UnlockType } from "./types";

export const STORAGE_KEY = "burialbound-state-v2";
const LEGACY_STORAGE_KEY = "burialbound-state-v1";

export const defaultRunState: RunState = {
  runName: "Grave Ledger",
  accountStyle: "Ironman",
  phase: "Early",
  pendingRites: [],
  memorialArchive: [],
  breaches: [],
  breachNotes: [],
  history: [],
  strictMode: true
};

export function createHistory(title: string, detail: string): HistoryEntry {
  return {
    id: createId("history"),
    timestamp: Date.now(),
    title,
    detail
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createRiteDraft(input: {
  unlockType: UnlockType;
  tier: UnlockTier;
  unlockName: string;
  surpassed: string;
  witness: string;
  proofNote: string;
  note: string;
}): Rite {
  const template = templateForType(input.unlockType);
  const tierRule = TIER_RULES[input.tier];
  const seed = `${input.unlockName}-${input.surpassed}-${input.tier}`;
  return {
    id: createId("rite"),
    unlockName: input.unlockName.trim(),
    unlockType: input.unlockType,
    tier: input.tier,
    templateId: template.id,
    status: "pending",
    surpassed: input.surpassed.trim(),
    witness: input.witness.trim(),
    proofNote: input.proofNote.trim(),
    offerings: pickFromPool(template.offeringPool, tierRule.offeringCount, seed),
    clauses: pickFromPool(template.clausePool, tierRule.clauseCount, seed),
    penalties: pickFromPool(template.penaltyPool, Math.min(2, template.penaltyPool.length), seed),
    completedOfferings: [],
    completedClauses: [],
    createdAt: Date.now(),
    note: input.note.trim()
  };
}

export function createStarterState(): RunState {
  const starterRites = STARTER_RITES.map((rite) => createRiteDraft(rite));
  return {
    ...defaultRunState,
    pendingRites: starterRites,
    history: [
      createHistory("Ledger opened", "Starter rites were placed in the chapel to demonstrate the full mode loop.")
    ]
  };
}

export function createBreach(input: {
  title: string;
  severity: BreachRecord["severity"];
  penalty: string;
  note: string;
}): BreachRecord {
  return {
    id: createId("breach"),
    title: input.title.trim(),
    severity: input.severity,
    penalty: input.penalty.trim(),
    status: "open",
    createdAt: Date.now(),
    note: input.note.trim()
  };
}

export function hydrateRite(rite: Partial<Rite>): Rite {
  const unlockType = rite.unlockType || "Gear";
  const tier = rite.tier || "Notable";
  const template = rite.templateId ? getTemplate(rite.templateId) : templateForType(unlockType);
  const generated = createRiteDraft({
    unlockType,
    tier,
    unlockName: rite.unlockName || "Unnamed unlock",
    surpassed: rite.surpassed || rite.note || "previous account state",
    witness: rite.witness || "Ledger witness",
    proofNote: rite.proofNote || "Proof was recorded in the memorial ledger.",
    note: rite.note || ""
  });
  return {
    ...generated,
    ...rite,
    unlockType,
    tier,
    templateId: template.id,
    status: rite.status || "pending",
    offerings: Array.isArray(rite.offerings) ? rite.offerings : generated.offerings,
    clauses: Array.isArray(rite.clauses) ? rite.clauses : generated.clauses,
    penalties: Array.isArray(rite.penalties) ? rite.penalties : generated.penalties,
    completedOfferings: Array.isArray(rite.completedOfferings) ? rite.completedOfferings : [],
    completedClauses: Array.isArray(rite.completedClauses) ? rite.completedClauses : [],
    createdAt: typeof rite.createdAt === "number" ? rite.createdAt : Date.now(),
    note: rite.note || ""
  };
}

export function hydrateBreach(record: Partial<BreachRecord> | string): BreachRecord {
  if (typeof record === "string") {
    return createBreach({
      title: "Imported breach note",
      severity: "Minor",
      penalty: "Add a manual atonement before the next major unlock.",
      note: record
    });
  }
  return {
    id: record.id || createId("breach"),
    title: record.title || "Unnamed breach",
    severity: record.severity || "Minor",
    penalty: record.penalty || "Complete a manual atonement.",
    status: record.status || "open",
    createdAt: typeof record.createdAt === "number" ? record.createdAt : Date.now(),
    resolvedAt: record.resolvedAt,
    note: record.note || ""
  };
}

export function hydrateState(parsed: Partial<RunState>): RunState {
  return {
    ...defaultRunState,
    ...parsed,
    accountStyle: parsed.accountStyle || "Ironman",
    phase: parsed.phase || "Early",
    pendingRites: Array.isArray(parsed.pendingRites) ? parsed.pendingRites.map(hydrateRite) : [],
    memorialArchive: Array.isArray(parsed.memorialArchive) ? parsed.memorialArchive.map(hydrateRite) : [],
    breaches: Array.isArray(parsed.breaches)
      ? parsed.breaches.map(hydrateBreach)
      : Array.isArray(parsed.breachNotes)
        ? parsed.breachNotes.map(hydrateBreach)
        : [],
    breachNotes: Array.isArray(parsed.breachNotes) ? parsed.breachNotes : [],
    history: Array.isArray(parsed.history) ? parsed.history : []
  };
}

export function loadRunState(): RunState {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return createStarterState();
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createStarterState();
    return hydrateState(JSON.parse(raw) as Partial<RunState>);
  } catch {
    return createStarterState();
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
