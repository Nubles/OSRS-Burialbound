export type UnlockType = "Gear" | "Boss" | "Region" | "Quest" | "Activity" | "Skill Tier";
export type RiteStatus = "pending" | "prepared" | "buried";
export type UnlockTier = "Minor" | "Notable" | "Major" | "Mythic";
export type AccountStyle = "Main" | "Ironman" | "Group Iron" | "Ultimate Iron" | "Hardcore";
export type RunPhase = "Early" | "Midgame" | "Late Game" | "Endgame";
export type BreachSeverity = "Minor" | "Serious" | "Grave";
export type BreachStatus = "open" | "atoned";

export interface RiteTemplate {
  id: string;
  unlockType: UnlockType;
  name: string;
  epitaph: string;
  offeringPool: string[];
  clausePool: string[];
  penaltyPool: string[];
  legalReward: string;
  forbiddenUntil: string;
  accent: string;
}

export interface Rite {
  id: string;
  unlockName: string;
  unlockType: UnlockType;
  tier: UnlockTier;
  templateId: string;
  status: RiteStatus;
  surpassed: string;
  witness: string;
  proofNote: string;
  offerings: string[];
  clauses: string[];
  penalties: string[];
  completedOfferings: string[];
  completedClauses: string[];
  createdAt: number;
  buriedAt?: number;
  note: string;
}

export interface BreachRecord {
  id: string;
  title: string;
  severity: BreachSeverity;
  penalty: string;
  status: BreachStatus;
  createdAt: number;
  resolvedAt?: number;
  note: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  title: string;
  detail: string;
}

export interface RunState {
  runName: string;
  accountStyle: AccountStyle;
  phase: RunPhase;
  pendingRites: Rite[];
  memorialArchive: Rite[];
  breaches: BreachRecord[];
  breachNotes: string[];
  history: HistoryEntry[];
  strictMode: boolean;
}
