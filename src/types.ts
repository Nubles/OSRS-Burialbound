export type UnlockType = "Gear" | "Boss" | "Region" | "Quest" | "Activity" | "Skill Tier";
export type RiteStatus = "pending" | "prepared" | "buried";

export interface RiteTemplate {
  id: string;
  unlockType: UnlockType;
  name: string;
  epitaph: string;
  offerings: string[];
  clauses: string[];
  legalReward: string;
  accent: string;
}

export interface Rite {
  id: string;
  unlockName: string;
  unlockType: UnlockType;
  templateId: string;
  status: RiteStatus;
  completedOfferings: string[];
  completedClauses: string[];
  createdAt: number;
  buriedAt?: number;
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
  pendingRites: Rite[];
  memorialArchive: Rite[];
  breachNotes: string[];
  history: HistoryEntry[];
  strictMode: boolean;
}
