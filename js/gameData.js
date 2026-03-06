// gameData.js

export const GAME_VERSION = "0.4.0";

// =========================
// RARIDADES
// =========================
export const RARITIES = {
  common: {
    id: "common",
    name: "Comum",
    color: "#bdbdbd",
    weight: 100,
    levelMultiplier: 1,
    bonusMultiplier: 1
  },
  rare: {
    id: "rare",
    name: "Raro",
    color: "#4aa3ff",
    weight: 35,
    levelMultiplier: 1.25,
    bonusMultiplier: 1.2
  },
  epic: {
    id: "epic",
    name: "Épico",
    color: "#b05cff",
    weight: 10,
    levelMultiplier: 1.5,
    bonusMultiplier: 1.45
  },
  legendary: {
    id: "legendary",
    name: "Lendário",
    color: "#ffb347",
    weight: 3,
    levelMultiplier: 1.9,
    bonusMultiplier: 1.8
  },
  mythic: {
    id: "mythic",
    name: "Mítico",
    color: "#ff5c8a",
    weight: 1,
    levelMultiplier: 2.4,
    bonusMultiplier: 2.2
  }
};

// =========================
// BIBLIOTECA DE DADOS
// =========================
export const DICE_LIBRARY = {
  dice_d6: {
    id: "dice_d6",
    kind: "dice",
    name: "d6",
    sides: 6,
    rarity: "common",
    baseWeight: 100,
    tags: ["basic", "balanced"],
    description: "Dado básico de 6 lados.",
    effect: {
      type: "none",
      value: 0
    }
  },

  dice_d8: {
    id: "dice_d8",
    kind: "dice",
    name: "d8",
    sides: 8,
    rarity: "common",
    baseWeight: 70,
    tags: ["basic", "mid"],
    description: "Dado de 8 lados.",
    effect: {
      type: "none",
      value: 0
    }
  },

  dice_d10: {
    id: "dice_d10",
    kind: "dice",
    name: "d10",
    sides: 10,
    rarity: "rare",
    baseWeight: 45,
    tags: ["basic", "high"],
    description: "Dado de 10 lados.",
    effect: {
      type: "none",
      value: 0
    }
  }
};

// =========================
// BIBLIOTECA DE CARTAS
// =========================
export const CARD_LIBRARY = {
  card_luck: {
    id: "card_luck",
    kind: "card",
    name: "Sorte",
    rarity: "common",
    tags: ["bonus", "flat"],
    description: "+1 no resultado final.",
    effect: {
      type: "flat_bonus",
      value: 1
    }
  },

  card_crit: {
    id: "card_crit",
    kind: "card",
    name: "Crítico",
    rarity: "rare",
    tags: ["crit", "max-roll"],
    description: "Se cair no valor máximo, dobra o resultado.",
    effect: {
      type: "max_double",
      value: 2
    }
  },

  card_even: {
    id: "card_even",
    kind: "card",
    name: "Par",
    rarity: "rare",
    tags: ["parity", "even"],
    description: "Se cair número par, multiplica o resultado por 2.",
    effect: {
      type: "even_double",
      value: 2
    }
  }
};

// =========================
// CONFIGURAÇÕES GERAIS
// =========================
export const MAX_DICE_SLOTS = 5;
export const MAX_CARD_SLOTS = 5;

export const SLOT_COSTS = {
  dice: [0, 300, 800, 2000, 5000],
  card: [0, 150, 400, 1000, 2500]
};

export const PACK_COSTS = {
  dice: 100,
  card: 120
};

export const DEFAULT_AUTOROLL_INTERVAL_MS = 2000;
export const DEFAULT_MAX_OFFLINE_SECONDS = 8 * 60 * 60;

// =========================
// UID
// =========================
export function generateItemUid(baseId) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  const timePart = Date.now().toString(36);
  return `${baseId}_${timePart}_${randomPart}`;
}

// =========================
// HELPERS DE CATÁLOGO
// =========================
export function getDiceBase(baseId) {
  return DICE_LIBRARY[baseId] || null;
}

export function getCardBase(baseId) {
  return CARD_LIBRARY[baseId] || null;
}

export function getLibraryItem(baseId) {
  return DICE_LIBRARY[baseId] || CARD_LIBRARY[baseId] || null;
}

export function getRarityData(rarityId) {
  return RARITIES[rarityId] || RARITIES.common;
}

// =========================
// CRIAÇÃO DE INSTÂNCIAS
// =========================
export function createDiceInstance(baseId, rarity = null) {
  const base = getDiceBase(baseId);

  if (!base) {
    throw new Error(`Dado não encontrado: ${baseId}`);
  }

  return {
    uid: generateItemUid(baseId),
    baseId: base.id,
    kind: "dice",
    level: 1,
    rarity: rarity || base.rarity,
    xp: 0,
    copies: 1,
    locked: false,
    obtainedAt: Date.now(),
    bonusStats: {
      flatBonus: 0,
      critChance: 0,
      goldMultiplier: 0
    },
    fusedFrom: []
  };
}

export function createCardInstance(baseId, rarity = null) {
  const base = getCardBase(baseId);

  if (!base) {
    throw new Error(`Carta não encontrada: ${baseId}`);
  }

  return {
    uid: generateItemUid(baseId),
    baseId: base.id,
    kind: "card",
    level: 1,
    rarity: rarity || base.rarity,
    xp: 0,
    copies: 1,
    locked: false,
    obtainedAt: Date.now(),
    bonusStats: {
      flatBonus: 0,
      evenMultiplier: 0,
      critMultiplier: 0
    },
    fusedFrom: []
  };
}

// =========================
// ESTADO INICIAL
// =========================
export function createInitialGameState() {
  const starterDice = {
    uid: "dice_d6_start_001",
    baseId: "dice_d6",
    kind: "dice",
    level: 1,
    rarity: "common",
    xp: 0,
    copies: 1,
    locked: false,
    obtainedAt: Date.now(),
    bonusStats: {
      flatBonus: 0,
      critChance: 0,
      goldMultiplier: 0
    },
    fusedFrom: []
  };

  return {
    version: GAME_VERSION,

    resources: {
      gold: 0,
      prestigeCurrency: 0
    },

    stats: {
      totalGoldEarned: 0,
      totalRolls: 0,
      totalPrestiges: 0,
      createdAt: Date.now(),
      lastSaveAt: Date.now(),
      lastSeenAt: Date.now()
    },

    progression: {
      autoRollUnlocked: false,
      offlineGainUnlocked: false,
      autoRollIntervalMs: DEFAULT_AUTOROLL_INTERVAL_MS,
      maxOfflineSeconds: DEFAULT_MAX_OFFLINE_SECONDS
    },

    inventory: {
      dice: [starterDice],
      cards: []
    },

    equipped: {
      diceSlots: ["dice_d6_start_001", null, null, null, null],
      cardSlots: [null, null, null, null, null]
    },

    slots: {
      diceUnlocked: 1,
      cardUnlocked: 1
    },

    collection: {
      discoveredDiceBaseIds: ["dice_d6"],
      discoveredCardBaseIds: [],
      collectionLevel: 0,
      milestones: {
        totalUniqueDice: 1,
        totalUniqueCards: 0,
        totalOwnedItems: 1
      },
      bonuses: {
        goldMultiplier: 0,
        rarityBonus: 0,
        rollBonus: 0
      }
    },

    ui: {
      selectedDiceSlot: 0,
      selectedCardSlot: 0,
      currentPage: "index",
      displayFace: 1,
      lastGain: 0,
      goldPerSecond: 0
    }
  };
}

// =========================
// INVENTÁRIO
// =========================
export function findInventoryItemByUid(game, uid) {
  if (!uid) return null;

  return (
    game.inventory.dice.find((item) => item.uid === uid) ||
    game.inventory.cards.find((item) => item.uid === uid) ||
    null
  );
}

export function getEquippedDice(game) {
  return game.equipped.diceSlots
    .map((uid) => findInventoryItemByUid(game, uid))
    .filter(Boolean);
}

export function getEquippedCards(game) {
  return game.equipped.cardSlots
    .map((uid) => findInventoryItemByUid(game, uid))
    .filter(Boolean);
}

export function getAllInventoryItems(game) {
  return [...game.inventory.dice, ...game.inventory.cards];
}

export function addItemToInventory(game, item) {
  if (!item || !item.kind) return;

  if (item.kind === "dice") {
    game.inventory.dice.push(item);
  } else if (item.kind === "card") {
    game.inventory.cards.push(item);
  }

  registerDiscoveredItem(game, item);
  refreshCollectionStats(game);
}

export function removeItemFromInventory(game, uid) {
  game.inventory.dice = game.inventory.dice.filter((item) => item.uid !== uid);
  game.inventory.cards = game.inventory.cards.filter((item) => item.uid !== uid);

  game.equipped.diceSlots = game.equipped.diceSlots.map((slotUid) =>
    slotUid === uid ? null : slotUid
  );

  game.equipped.cardSlots = game.equipped.cardSlots.map((slotUid) =>
    slotUid === uid ? null : slotUid
  );

  refreshCollectionStats(game);
}

// =========================
// EQUIPAR / DESEQUIPAR
// =========================
export function equipItemInSlot(game, kind, slotIndex, uid) {
  const item = findInventoryItemByUid(game, uid);
  if (!item) return false;

  if (item.kind !== kind) return false;

  if (kind === "dice") {
    if (slotIndex >= game.slots.diceUnlocked) return false;
    game.equipped.diceSlots[slotIndex] = uid;
    return true;
  }

  if (kind === "card") {
    if (slotIndex >= game.slots.cardUnlocked) return false;
    game.equipped.cardSlots[slotIndex] = uid;
    return true;
  }

  return false;
}

export function unequipItemFromSlot(game, kind, slotIndex) {
  if (kind === "dice") {
    if (slotIndex < 0 || slotIndex >= MAX_DICE_SLOTS) return false;
    game.equipped.diceSlots[slotIndex] = null;
    return true;
  }

  if (kind === "card") {
    if (slotIndex < 0 || slotIndex >= MAX_CARD_SLOTS) return false;
    game.equipped.cardSlots[slotIndex] = null;
    return true;
  }

  return false;
}

// =========================
// COLEÇÃO
// =========================
export function registerDiscoveredItem(game, item) {
  if (!item) return;

  if (item.kind === "dice") {
    if (!game.collection.discoveredDiceBaseIds.includes(item.baseId)) {
      game.collection.discoveredDiceBaseIds.push(item.baseId);
    }
  }

  if (item.kind === "card") {
    if (!game.collection.discoveredCardBaseIds.includes(item.baseId)) {
      game.collection.discoveredCardBaseIds.push(item.baseId);
    }
  }
}

export function refreshCollectionStats(game) {
  const uniqueDice = game.collection.discoveredDiceBaseIds.length;
  const uniqueCards = game.collection.discoveredCardBaseIds.length;
  const totalOwnedItems = game.inventory.dice.length + game.inventory.cards.length;

  game.collection.milestones.totalUniqueDice = uniqueDice;
  game.collection.milestones.totalUniqueCards = uniqueCards;
  game.collection.milestones.totalOwnedItems = totalOwnedItems;

  game.collection.bonuses.goldMultiplier =
    uniqueDice * 0.01 + uniqueCards * 0.01 + totalOwnedItems * 0.0025;

  game.collection.bonuses.rarityBonus =
    Math.floor((uniqueDice + uniqueCards) / 5) * 0.01;

  game.collection.bonuses.rollBonus =
    Math.floor(totalOwnedItems / 10);
}

// =========================
// PACKS ALEATÓRIOS
// =========================
export function getRandomWeightedEntry(entries) {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of entries) {
    random -= entry.weight;
    if (random <= 0) {
      return entry;
    }
  }

  return entries[entries.length - 1];
}

export function rollRandomRarity(extraBonus = 0) {
  const entries = Object.values(RARITIES).map((rarity) => ({
    id: rarity.id,
    weight: Math.max(0.0001, rarity.weight * (rarity.id === "common" ? 1 : 1 + extraBonus))
  }));

  return getRandomWeightedEntry(entries).id;
}

export function openRandomDicePack(game) {
  const baseEntries = Object.values(DICE_LIBRARY).map((dice) => ({
    id: dice.id,
    weight: dice.baseWeight
  }));

  const chosenBase = getRandomWeightedEntry(baseEntries).id;
  const rarity = rollRandomRarity(game.collection.bonuses.rarityBonus || 0);
  const item = createDiceInstance(chosenBase, rarity);

  addItemToInventory(game, item);
  return item;
}

export function openRandomCardPack(game) {
  const baseEntries = Object.values(CARD_LIBRARY).map((card) => ({
    id: card.id,
    weight: 100
  }));

  const chosenBase = getRandomWeightedEntry(baseEntries).id;
  const rarity = rollRandomRarity(game.collection.bonuses.rarityBonus || 0);
  const item = createCardInstance(chosenBase, rarity);

  addItemToInventory(game, item);
  return item;
}

// =========================
// FUSÃO
// =========================
export function getFusionCandidates(game, kind, baseId, rarity, level) {
  const source = kind === "dice" ? game.inventory.dice : game.inventory.cards;

  return source.filter(
    (item) =>
      item.baseId === baseId &&
      item.rarity === rarity &&
      item.level === level &&
      !item.locked
  );
}

export function canFuseItems(items, requiredCopies = 3) {
  return Array.isArray(items) && items.length >= requiredCopies;
}

export function fuseItems(game, kind, items, requiredCopies = 3) {
  if (!canFuseItems(items, requiredCopies)) return null;

  const selected = items.slice(0, requiredCopies);
  const baseTemplate = selected[0];
  const baseData = getLibraryItem(baseTemplate.baseId);

  if (!baseData) return null;

  selected.forEach((item) => removeItemFromInventory(game, item.uid));

  const fusedItem =
    kind === "dice"
      ? createDiceInstance(baseTemplate.baseId, baseTemplate.rarity)
      : createCardInstance(baseTemplate.baseId, baseTemplate.rarity);

  fusedItem.level = baseTemplate.level + 1;
  fusedItem.fusedFrom = selected.map((item) => item.uid);

  addItemToInventory(game, fusedItem);
  return fusedItem;
}