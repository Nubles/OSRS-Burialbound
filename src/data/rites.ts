import { AccountStyle, BreachSeverity, RiteTemplate, RunPhase, UnlockTier, UnlockType } from "../types";

export const UNLOCK_TYPES: UnlockType[] = ["Gear", "Boss", "Region", "Quest", "Activity", "Skill Tier"];
export const UNLOCK_TIERS: UnlockTier[] = ["Minor", "Notable", "Major", "Mythic"];
export const ACCOUNT_STYLES: AccountStyle[] = ["Main", "Ironman", "Group Iron", "Ultimate Iron", "Hardcore"];
export const RUN_PHASES: RunPhase[] = ["Early", "Midgame", "Late Game", "Endgame"];
export const BREACH_SEVERITIES: BreachSeverity[] = ["Minor", "Serious", "Grave"];

export const TIER_RULES: Record<UnlockTier, { offeringCount: number; clauseCount: number; weight: number; label: string }> = {
  Minor: { offeringCount: 2, clauseCount: 1, weight: 1, label: "small convenience or sidegrade" },
  Notable: { offeringCount: 3, clauseCount: 2, weight: 2, label: "meaningful account upgrade" },
  Major: { offeringCount: 4, clauseCount: 3, weight: 3, label: "large progression gate" },
  Mythic: { offeringCount: 5, clauseCount: 4, weight: 5, label: "account-defining milestone" }
};

export const RITE_TEMPLATES: RiteTemplate[] = [
  {
    id: "retired-gear",
    unlockType: "Gear",
    name: "Rite of the Retired Tool",
    epitaph: "The old edge is named, dulled, and laid beneath the chapel stone before the new one may be carried.",
    offeringPool: [
      "Retire, alch, or permanently bank a lower-tier item",
      "Bank a symbolic replacement material",
      "Record the first planned use of the new gear",
      "Complete one final kill or task using the old gear",
      "Spend or sacrifice supplies equal to the upgrade's importance",
      "Write an epitaph naming what the old item carried you through"
    ],
    clausePool: [
      "Do not equip the new item before burial",
      "The retired item cannot be reclaimed for combat",
      "One witness note must be logged",
      "Any accidental use requires a breach record",
      "The first legal use must match the stated proof note"
    ],
    penaltyPool: [
      "Discard the first duplicate drop from the new gear's grind",
      "Complete one old-tier task before using the gear again",
      "Bank the new item for one session and log an atonement"
    ],
    legalReward: "New gear tier becomes legal.",
    forbiddenUntil: "Equip, attack with, or benefit from the new gear.",
    accent: "#b88a4d"
  },
  {
    id: "fallen-enemy",
    unlockType: "Boss",
    name: "Rite of the Fallen Enemy",
    epitaph: "A lesser foe is remembered so the greater hunt does not begin as simple greed.",
    offeringPool: [
      "Defeat a thematically linked lesser enemy",
      "Offer bones, ashes, or a trophy drop",
      "Name the first boss objective",
      "Prepare a supply inventory without using boss loot",
      "Log a practice route or escape plan",
      "Retire one lesser enemy from the active target list"
    ],
    clausePool: [
      "No boss kill before the rite is complete",
      "Supply gathering must match the boss theme",
      "One failed attempt may be logged as a vigil",
      "No selling first unique until it is archived",
      "No death-reclaim shortcut unless strict mode is off"
    ],
    penaltyPool: [
      "Perform ten lesser enemy kills before returning",
      "Destroy or bank the first non-essential boss reward",
      "Run a supply-only preparation session before the next attempt"
    ],
    legalReward: "Target boss becomes legal.",
    forbiddenUntil: "Enter the boss encounter, claim boss loot, or use boss collection log progress.",
    accent: "#8f5d5d"
  },
  {
    id: "old-border",
    unlockType: "Region",
    name: "Rite of the Old Border",
    epitaph: "The previous land is thanked before the account crosses into a stranger road.",
    offeringPool: [
      "Complete one final task in the old region",
      "Bank a local resource as grave soil",
      "Write the reason for crossing",
      "Mark the exact travel route that makes the crossing legal",
      "Complete a local clue, diary step, or skilling action",
      "Choose one old-region restriction to keep for the first session"
    ],
    clausePool: [
      "No banking in the new region before burial",
      "No region shops before approval",
      "Transport shortcuts count as breaches",
      "New-region drops are unusable until approved",
      "First legal action must be written before crossing"
    ],
    penaltyPool: [
      "Return to the old region and complete a local task",
      "Drop or ignore the first new-region loot roll",
      "Lock the crossed border for one session after atonement"
    ],
    legalReward: "New region access becomes legal.",
    forbiddenUntil: "Bank, shop, gather, fight, quest, or train in the new region.",
    accent: "#6e7f5f"
  },
  {
    id: "quest-ashes",
    unlockType: "Quest",
    name: "Rite of Quest Ashes",
    epitaph: "A quest reward is not claimed until the story it replaces has been given a closing line.",
    offeringPool: [
      "Complete or revisit a related older quest",
      "Log the reward being unlocked",
      "Retire one old task from the journal",
      "Write the reward's first legal use",
      "Bank one quest-themed item or resource",
      "Complete one post-quest gratitude task"
    ],
    clausePool: [
      "Do not use the reward before burial",
      "Quest lamps must stay unspent until approval",
      "Dialogue skips should be noted",
      "Quest-locked travel stays illegal until approval",
      "Reward gear cannot be equipped during the rite"
    ],
    penaltyPool: [
      "Spend a lamp on the lowest eligible skill",
      "Complete an old quest cleanup task",
      "Delay the quest reward use until another rite is buried"
    ],
    legalReward: "Quest reward becomes legal.",
    forbiddenUntil: "Use quest rewards, lamps, areas, shops, or travel unlocked by the quest.",
    accent: "#7b689d"
  },
  {
    id: "closed-practice",
    unlockType: "Activity",
    name: "Rite of Closed Practice",
    epitaph: "The old routine is ended with care before a new grind can become lawful.",
    offeringPool: [
      "Finish a final session of the old activity",
      "Record the replacement activity",
      "Bank one proof item or screenshot note",
      "Set the legal reward target for the new activity",
      "Complete a warm-up round without claiming rewards",
      "Name one reward that remains forbidden until archived"
    ],
    clausePool: [
      "No rewards from the new activity before burial",
      "A trial run is allowed only if marked as vigil",
      "Loot outside the rite must be discarded",
      "First reward claim must be written in proof",
      "Minigame currency cannot be spent early"
    ],
    penaltyPool: [
      "Complete one old activity session without reward use",
      "Bank new activity rewards until a second rite is prepared",
      "Sacrifice one reward roll or equivalent supply stack"
    ],
    legalReward: "New activity becomes legal.",
    forbiddenUntil: "Claim rewards, spend currency, or count progress from the new activity.",
    accent: "#4f7b83"
  },
  {
    id: "surpassed-tier",
    unlockType: "Skill Tier",
    name: "Rite of the Surpassed Tier",
    epitaph: "The account marks the level it has outgrown before claiming the next tier of power.",
    offeringPool: [
      "Train one final inventory at the old tier",
      "Bank materials from the old tier",
      "Declare the first unlock of the new tier",
      "Craft, cook, fletch, or gather one memorial stack",
      "Record the old method being retired",
      "Complete a slow method once before using the efficient one"
    ],
    clausePool: [
      "Do not use new-tier outputs before burial",
      "Boosted access requires a breach note",
      "One old-tier method must be retired",
      "First legal output must be tracked",
      "Bought resources require strict-mode approval"
    ],
    penaltyPool: [
      "Train one more old-tier inventory",
      "Bank new-tier outputs until a witness note is added",
      "Discard one boosted output and repeat naturally"
    ],
    legalReward: "New skill tier becomes legal.",
    forbiddenUntil: "Use, sell, equip, or benefit from new-tier outputs.",
    accent: "#5f8b65"
  }
];

export const STARTER_RITES = [
  {
    unlockType: "Gear" as UnlockType,
    tier: "Notable" as UnlockTier,
    unlockName: "First lawful upgrade",
    surpassed: "starter equipment",
    witness: "Lumbridge chapel record",
    proofNote: "Use the upgrade for one declared task after burial.",
    note: "Starter example: bury the old tool before claiming the upgrade."
  },
  {
    unlockType: "Region" as UnlockType,
    tier: "Major" as UnlockTier,
    unlockName: "Morytania crossing",
    surpassed: "safe mainland routine",
    witness: "Border cairn",
    proofNote: "First legal action is gathering a local token.",
    note: "Shows how region rites can carry travel restrictions."
  }
];

export function templateForType(type: UnlockType): RiteTemplate {
  return RITE_TEMPLATES.find((template) => template.unlockType === type) || RITE_TEMPLATES[0];
}

export function getTemplate(id: string): RiteTemplate {
  return RITE_TEMPLATES.find((template) => template.id === id) || RITE_TEMPLATES[0];
}

export function pickFromPool(pool: string[], count: number, seed: string): string[] {
  const offset = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % pool.length;
  return Array.from({ length: Math.min(count, pool.length) }, (_, index) => pool[(offset + index) % pool.length]);
}
