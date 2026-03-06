import {
  createInitialGameState,
  getEquippedCards
} from "./gameData.js";

const STORAGE_KEY = "diceCardsIdle_v04";

const goldEl = document.getElementById("gold");
const diceEl = document.getElementById("dice");
const gainTextEl = document.getElementById("gainText");
const rollBtn = document.getElementById("rollBtn");
const shopBtn = document.getElementById("shopBtn");

const slot1 = document.getElementById("slot1");
const slot2 = document.getElementById("slot2");
const slot3 = document.getElementById("slot3");

let game = loadGame();
let isRolling = false;
let autoRollInterval = null;
let diceAnimationInterval = null;

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialGameState();

    const parsed = JSON.parse(raw);
    return mergeWithInitialState(parsed);
  } catch {
    return createInitialGameState();
  }
}

function mergeWithInitialState(save) {
  const base = createInitialGameState();

  return {
    ...base,
    ...save,
    resources: {
      ...base.resources,
      ...(save.resources || {})
    },
    stats: {
      ...base.stats,
      ...(save.stats || {})
    },
    progression: {
      ...base.progression,
      ...(save.progression || {})
    },
    inventory: {
      dice: Array.isArray(save.inventory?.dice) ? save.inventory.dice : base.inventory.dice,
      cards: Array.isArray(save.inventory?.cards) ? save.inventory.cards : base.inventory.cards
    },
    equipped: {
      diceSlots: Array.isArray(save.equipped?.diceSlots) ? save.equipped.diceSlots : base.equipped.diceSlots,
      cardSlots: Array.isArray(save.equipped?.cardSlots) ? save.equipped.cardSlots : base.equipped.cardSlots
    },
    slots: {
      ...base.slots,
      ...(save.slots || {})
    },
    collection: {
      ...base.collection,
      ...(save.collection || {}),
      milestones: {
        ...base.collection.milestones,
        ...(save.collection?.milestones || {})
      },
      bonuses: {
        ...base.collection.bonuses,
        ...(save.collection?.bonuses || {})
      }
    },
    ui: {
      ...base.ui,
      ...(save.ui || {})
    }
  };
}

function saveGame() {
  game.stats.lastSaveAt = Date.now();
  game.stats.lastSeenAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}

function applyOfflineProgress() {
  if (!game.progression.offlineGainUnlocked) return;

  const now = Date.now();
  const elapsedMs = now - (game.stats.lastSaveAt || now);
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const cappedSeconds = Math.min(elapsedSeconds, game.progression.maxOfflineSeconds || 28800);

  const gain = Math.floor(cappedSeconds * 0.5);
  if (gain > 0) {
    game.resources.gold += gain;
    game.stats.totalGoldEarned += gain;
    game.ui.lastGain = gain;
  }
}

function randomRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function getEquippedDiceSides() {
  const equippedDice = game.equipped.diceSlots
    .map((uid) => game.inventory.dice.find((item) => item.uid === uid))
    .filter(Boolean);

  if (!equippedDice.length) return 6;

  const firstDie = equippedDice[0];
  const baseId = firstDie.baseId;

  if (baseId === "dice_d8") return 8;
  if (baseId === "dice_d10") return 10;
  return 6;
}

function calculateFinalResult(roll) {
  let result = roll;
  const equippedCards = getEquippedCards(game);

  for (const card of equippedCards) {
    if (card.baseId === "card_luck") {
      result += 1;
    }

    if (card.baseId === "card_crit" && roll === getEquippedDiceSides()) {
      result *= 2;
    }

    if (card.baseId === "card_even" && roll % 2 === 0) {
      result *= 2;
    }
  }

  result += game.collection.bonuses.rollBonus || 0;
  result = Math.floor(result * (1 + (game.collection.bonuses.goldMultiplier || 0)));

  return result;
}

function updateSlotsUI() {
  const equippedCards = getEquippedCards(game);

  const labels = game.equipped.cardSlots.map((uid, index) => {
    if (!uid) return `Slot ${index + 1}`;

    const card = equippedCards.find((item) => item.uid === uid) ||
      game.inventory.cards.find((item) => item.uid === uid);

    if (!card) return `Slot ${index + 1}`;

    if (card.baseId === "card_luck") return "Sorte";
    if (card.baseId === "card_crit") return "Crítico";
    if (card.baseId === "card_even") return "Par";
    return `Slot ${index + 1}`;
  });

  slot1.classList.remove("locked");
  slot1.innerHTML = labels[0] || "Slot 1";

  if (game.slots.cardUnlocked >= 2) {
    slot2.classList.remove("locked");
    slot2.innerHTML = labels[1] || "Slot 2";
  } else {
    slot2.classList.add("locked");
    slot2.innerHTML = "Slot 2<br><span>150 ouro</span>";
  }

  if (game.slots.cardUnlocked >= 3) {
    slot3.classList.remove("locked");
    slot3.innerHTML = labels[2] || "Slot 3";
  } else {
    slot3.classList.add("locked");
    slot3.innerHTML = "Slot 3<br><span>400 ouro</span>";
  }
}

function updateUI() {
  goldEl.textContent = game.resources.gold;
  diceEl.textContent = game.ui.displayFace;
  gainTextEl.textContent = `+${game.ui.lastGain} ouro`;
  updateSlotsUI();
}

function animateDice(finalFace, sides, onComplete) {
  if (diceAnimationInterval) {
    clearInterval(diceAnimationInterval);
    diceAnimationInterval = null;
  }

  let steps = 0;
  const totalSteps = 9;

  diceAnimationInterval = setInterval(() => {
    diceEl.textContent = randomRoll(sides);
    steps++;

    if (steps >= totalSteps) {
      clearInterval(diceAnimationInterval);
      diceAnimationInterval = null;
      diceEl.textContent = finalFace;
      onComplete();
    }
  }, 70);
}

function rollDice() {
  if (isRolling) return;

  const sides = getEquippedDiceSides();

  isRolling = true;
  rollBtn.disabled = true;

  const roll = randomRoll(sides);

  animateDice(roll, sides, () => {
    const finalResult = calculateFinalResult(roll);

    game.ui.displayFace = roll;
    game.ui.lastGain = finalResult;
    game.resources.gold += finalResult;
    game.stats.totalGoldEarned += finalResult;
    game.stats.totalRolls += 1;

    updateUI();
    saveGame();

    isRolling = false;
    rollBtn.disabled = false;
  });
}

function stopAutoRoll() {
  if (autoRollInterval) {
    clearInterval(autoRollInterval);
    autoRollInterval = null;
  }
}

function startAutoRoll() {
  stopAutoRoll();

  if (!game.progression.autoRollUnlocked) return;

  autoRollInterval = setInterval(() => {
    if (!isRolling) {
      rollDice();
    }
  }, game.progression.autoRollIntervalMs || 2000);
}

function unlockSlot(slotNumber) {
  if (slotNumber === 2 && game.slots.cardUnlocked < 2 && game.resources.gold >= 150) {
    game.resources.gold -= 150;
    game.slots.cardUnlocked = 2;
    return true;
  }

  if (slotNumber === 3 && game.slots.cardUnlocked < 3 && game.resources.gold >= 400) {
    game.resources.gold -= 400;
    game.slots.cardUnlocked = 3;
    return true;
  }

  return false;
}

function cycleCardInSlot(slotIndex) {
  const availableCards = game.inventory.cards.slice();
  if (!availableCards.length) return false;

  const currentUid = game.equipped.cardSlots[slotIndex];
  const cycleOptions = [null, ...availableCards.map((card) => card.uid)];
  const currentIndex = cycleOptions.indexOf(currentUid);
  const nextIndex = (currentIndex + 1) % cycleOptions.length;
  const nextUid = cycleOptions[nextIndex];

  if (nextUid && game.equipped.cardSlots.includes(nextUid)) {
    const otherIndex = game.equipped.cardSlots.indexOf(nextUid);
    game.equipped.cardSlots[otherIndex] = currentUid;
  }

  game.equipped.cardSlots[slotIndex] = nextUid;
  return true;
}

function handleSlotClick(slotNumber) {
  const slotIndex = slotNumber - 1;

  if (game.slots.cardUnlocked < slotNumber) {
    const unlocked = unlockSlot(slotNumber);
    if (unlocked) {
      updateUI();
      saveGame();
    }
    return;
  }

  const changed = cycleCardInSlot(slotIndex);
  if (changed) {
    updateUI();
    saveGame();
  }
}

rollBtn.addEventListener("click", rollDice);

shopBtn.addEventListener("click", () => {
  window.location.href = "./shop.html";
});

slot1.addEventListener("click", () => handleSlotClick(1));
slot2.addEventListener("click", () => handleSlotClick(2));
slot3.addEventListener("click", () => handleSlotClick(3));

applyOfflineProgress();

if (!game.ui.displayFace || game.ui.displayFace > getEquippedDiceSides()) {
  game.ui.displayFace = 1;
}

updateUI();
startAutoRoll();
setInterval(saveGame, 5000);