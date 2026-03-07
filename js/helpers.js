import { createInitialGameState, DICE_DATA, CARD_DATA } from "./gameData.js";

export const SAVE_KEY = "dice_cards_idle_save";

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialGameState();

    const parsed = JSON.parse(raw);
    const initial = createInitialGameState();

    return {
      ...initial,
      ...parsed,
      inventory: {
        ...initial.inventory,
        ...(parsed.inventory || {}),
        dice: Array.isArray(parsed.inventory?.dice) ? parsed.inventory.dice : initial.inventory.dice,
        cards: Array.isArray(parsed.inventory?.cards) ? parsed.inventory.cards : initial.inventory.cards
      },
      equippedDice: Array.isArray(parsed.equippedDice) ? parsed.equippedDice : initial.equippedDice,
      equippedCards: Array.isArray(parsed.equippedCards) ? parsed.equippedCards : initial.equippedCards
    };
  } catch {
    return createInitialGameState();
  }
}

export function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function formatRarity(rarity) {
  const map = {
    common: "Comum",
    uncommon: "Incomum",
    rare: "Rara",
    epic: "Épica",
    legendary: "Lendária"
  };
  return map[rarity] || "Comum";
}

export function getRarityClass(rarity) {
  return `rarity-${rarity || "common"}`;
}

export function getOwnedDieByUid(state, uid) {
  return state.inventory.dice.find((item) => item.uid === uid) || null;
}

export function getOwnedCardByUid(state, uid) {
  return state.inventory.cards.find((item) => item.uid === uid) || null;
}

export function getEquippedCardEffects(state) {
  return state.equippedCards
    .map((uid) => getOwnedCardByUid(state, uid))
    .filter(Boolean)
    .map((card) => CARD_DATA[card.baseId]?.effect)
    .filter(Boolean);
}

export function stackInventoryItems(items) {
  const map = new Map();

  items.forEach((item) => {
    if (!map.has(item.baseId)) {
      map.set(item.baseId, {
        baseId: item.baseId,
        quantity: 0,
        items: []
      });
    }

    const entry = map.get(item.baseId);
    entry.quantity += 1;
    entry.items.push(item);
  });

  return Array.from(map.values());
}

export function countEquippedByBaseId(state, type, baseId) {
  const slots = type === "dice" ? state.equippedDice : state.equippedCards;
  const inventory = type === "dice" ? state.inventory.dice : state.inventory.cards;

  let count = 0;

  slots.forEach((uid) => {
    if (!uid) return;
    const item = inventory.find((entry) => entry.uid === uid);
    if (item?.baseId === baseId) count += 1;
  });

  return count;
}

export function getDisplayData(type, baseId) {
  return type === "dice" ? DICE_DATA[baseId] : CARD_DATA[baseId];
}