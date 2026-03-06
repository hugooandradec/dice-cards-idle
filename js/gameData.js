export const DICE_DATA = {
  d6_basic: {
    id: "d6_basic",
    name: "Dado Básico",
    sides: 6,
    rarity: "common",
    description: "Um d6 simples. Sem bônus extras.",
    icon: "d6"
  },
  d6_lucky: {
    id: "d6_lucky",
    name: "Dado da Sorte",
    sides: 6,
    rarity: "uncommon",
    description: "Dado confiável para builds de ouro constante.",
    icon: "d6"
  },
  d8_heavy: {
    id: "d8_heavy",
    name: "Dado Pesado",
    sides: 8,
    rarity: "rare",
    description: "Tem mais lados, aumentando o teto da rolagem.",
    icon: "d8"
  },
  d10_sharp: {
    id: "d10_sharp",
    name: "Dado Afiado",
    sides: 10,
    rarity: "epic",
    description: "Um dado mais raro, com rolagens mais altas.",
    icon: "d10"
  },
  d20_ancient: {
    id: "d20_ancient",
    name: "Dado Ancestral",
    sides: 20,
    rarity: "legendary",
    description: "Um monstro de build. Alto teto de ouro.",
    icon: "d20"
  }
};

export const CARD_DATA = {
  card_crit: {
    id: "card_crit",
    name: "Crítico",
    rarity: "common",
    description: "10% de chance de dobrar o ouro total da rolagem.",
    effect: {
      type: "critChance",
      value: 0.10
    }
  },
  card_luck: {
    id: "card_luck",
    name: "Sorte",
    rarity: "common",
    description: "+1 no resultado final de cada dado rolado.",
    effect: {
      type: "flatPerDie",
      value: 1
    }
  },
  card_greed: {
    id: "card_greed",
    name: "Ganância",
    rarity: "uncommon",
    description: "+25% de ouro total após aplicar todos os bônus.",
    effect: {
      type: "goldMultiplier",
      value: 1.25
    }
  },
  card_focus: {
    id: "card_focus",
    name: "Foco",
    rarity: "rare",
    description: "Rerrola automaticamente 1 dado que sair 1.",
    effect: {
      type: "rerollOnOne",
      value: 1
    }
  }
};

export function createInitialGameState() {
  return {
    version: "0.3",
    gold: 113,
    lastRollGain: 4,
    lastRollSlots: [4, null, null, null, null],
    inventory: {
      dice: [
        { uid: "die_1", baseId: "d6_basic" },
        { uid: "die_2", baseId: "d6_lucky" },
        { uid: "die_3", baseId: "d8_heavy" },
        { uid: "die_4", baseId: "d10_sharp" },
        { uid: "die_5", baseId: "d20_ancient" }
      ],
      cards: [
        { uid: "card_1", baseId: "card_crit" },
        { uid: "card_2", baseId: "card_luck" },
        { uid: "card_3", baseId: "card_greed" },
        { uid: "card_4", baseId: "card_focus" }
      ]
    },
    equippedDice: ["die_1", "die_3", "die_2", null, null],
    equippedCards: ["card_4", "card_3", "card_1", "card_2", null]
  };
}