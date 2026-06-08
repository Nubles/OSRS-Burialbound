import { RiteTemplate, UnlockType } from "../types";

export const UNLOCK_TYPES: UnlockType[] = ["Gear", "Boss", "Region", "Quest", "Activity", "Skill Tier"];

export const RITE_TEMPLATES: RiteTemplate[] = [
  {
    id: "retired-gear",
    unlockType: "Gear",
    name: "Rite of the Retired Tool",
    epitaph: "The old edge is named, dulled, and laid beneath the chapel stone before the new one may be carried.",
    offerings: ["Retire or alch a lower-tier item", "Bank a symbolic replacement material", "Record the first planned use of the new gear"],
    clauses: ["Do not equip the new item before burial", "The retired item cannot be reclaimed for combat", "One witness note must be logged"],
    legalReward: "New gear tier becomes legal.",
    accent: "#b88a4d"
  },
  {
    id: "fallen-enemy",
    unlockType: "Boss",
    name: "Rite of the Fallen Enemy",
    epitaph: "A lesser foe is remembered so the greater hunt does not begin as simple greed.",
    offerings: ["Defeat a thematically linked lesser enemy", "Offer bones, ashes, or a trophy drop", "Name the first boss objective"],
    clauses: ["No boss kill before the rite is complete", "Supply gathering must match the boss theme", "One failed attempt may be logged as a vigil"],
    legalReward: "Target boss becomes legal.",
    accent: "#8f5d5d"
  },
  {
    id: "old-border",
    unlockType: "Region",
    name: "Rite of the Old Border",
    epitaph: "The previous land is thanked before the account crosses into a stranger road.",
    offerings: ["Complete one final task in the old region", "Bank a local resource as grave soil", "Write the reason for crossing"],
    clauses: ["No banking in the new region before burial", "No region shops before approval", "Transport shortcuts count as breaches"],
    legalReward: "New region access becomes legal.",
    accent: "#6e7f5f"
  },
  {
    id: "quest-ashes",
    unlockType: "Quest",
    name: "Rite of Quest Ashes",
    epitaph: "A quest reward is not claimed until the story it replaces has been given a closing line.",
    offerings: ["Complete or revisit a related older quest", "Log the reward being unlocked", "Retire one old task from the journal"],
    clauses: ["Do not use the reward before burial", "Quest lamps must stay unspent until approval", "Dialogue skips should be noted"],
    legalReward: "Quest reward becomes legal.",
    accent: "#7b689d"
  },
  {
    id: "closed-practice",
    unlockType: "Activity",
    name: "Rite of Closed Practice",
    epitaph: "The old routine is ended with care before a new grind can become lawful.",
    offerings: ["Finish a final session of the old activity", "Record the replacement activity", "Bank one proof item or screenshot note"],
    clauses: ["No rewards from the new activity before burial", "A trial run is allowed only if marked as vigil", "Loot outside the rite must be discarded"],
    legalReward: "New activity becomes legal.",
    accent: "#4f7b83"
  },
  {
    id: "surpassed-tier",
    unlockType: "Skill Tier",
    name: "Rite of the Surpassed Tier",
    epitaph: "The account marks the level it has outgrown before claiming the next tier of power.",
    offerings: ["Train one final inventory at the old tier", "Bank materials from the old tier", "Declare the first unlock of the new tier"],
    clauses: ["Do not use new-tier outputs before burial", "Boosted access requires a breach note", "One old-tier method must be retired"],
    legalReward: "New skill tier becomes legal.",
    accent: "#5f8b65"
  }
];

export function templateForType(type: UnlockType): RiteTemplate {
  return RITE_TEMPLATES.find((template) => template.unlockType === type) || RITE_TEMPLATES[0];
}

export function getTemplate(id: string): RiteTemplate {
  return RITE_TEMPLATES.find((template) => template.id === id) || RITE_TEMPLATES[0];
}
