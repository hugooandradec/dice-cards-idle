const STORAGE_KEY = "diceCardsIdle_v03";

const CARD_NAMES = {
  luck: "Sorte",
  crit: "Crítico",
  even: "Par"
};

const SLOT_COSTS = {
  2: 150,
  3: 400
};

const DEFAULT_GAME = {
  gold: 0,
  dice: 6,
  ownedDice: [6],
  ownedCards: [],
  equippedCards: [null, null, null],
  unlockedSlots: 1,
  autoroll: false,
  offline: false,
  lastSave: Date.now(),
  displayFace: 1,
  finalResult: 0
};

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
    if (!raw) return { ...DEFAULT_GAME };

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_GAME,
      ...parsed,
      ownedDice: Array.isArray(parsed.ownedDice) && parsed.ownedDice.length ? parsed.ownedDice : [6],
      ownedCards: Array.isArray(parsed.ownedCards) ? parsed.ownedCards : [],
      equippedCards: Array.isArray(parsed.equippedCards) && parsed.equippedCards.length === 3
        ? parsed.equippedCards
        : [null, null, null]
    };
  } catch {
    return { ...DEFAULT_GAME };
  }
}

function saveGame() {
  game.lastSave = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}

function applyOfflineProgress() {
  if (!game.offline) return;

  const now = Date.now();
  const elapsedMs = now - (game.lastSave || now);
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const cappedSeconds = Math.min(elapsedSeconds, 8 * 60 * 60);
  const gain = Math.floor(cappedSeconds * 0.5);

  if (gain > 0) {
    game.gold += gain;
    game.finalResult = gain;
  }
}

function randomRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function getCardName(cardId) {
  return CARD_NAMES[cardId] || "Slot";
}

function calculateFinalResult(roll) {
  let result = roll;

  if (game.equippedCards.includes("luck")) {
    result += 1;
  }

  if (game.equippedCards.includes("crit") && roll === game.dice) {
    result *= 2;
  }

  if (game.equippedCards.includes("even") && roll % 2 === 0) {
    result *= 2;
  }

  return result;
}

function updateSlotsUI() {
  slot1.classList.remove("locked");
  slot1.innerHTML = game.equippedCards[0] ? getCardName(game.equippedCards[0]) : "Slot 1";

  if (game.unlockedSlots >= 2) {
    slot2.classList.remove("locked");
    slot2.innerHTML = game.equippedCards[1] ? getCardName(game.equippedCards[1]) : "Slot 2";
  } else {
    slot2.classList.add("locked");
    slot2.innerHTML = `Slot 2<br><span>${SLOT_COSTS[2]} ouro</span>`;
  }

  if (game.unlockedSlots >= 3) {
    slot3.classList.remove("locked");
    slot3.innerHTML = game.equippedCards[2] ? getCardName(game.equippedCards[2]) : "Slot 3";
  } else {
    slot3.classList.add("locked");
    slot3.innerHTML = `Slot 3<br><span>${SLOT_COSTS[3]} ouro</span>`;
  }
}

function updateUI() {
  goldEl.textContent = game.gold;
  diceEl.textContent = game.displayFace;
  gainTextEl.textContent = `+${game.finalResult} ouro`;
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

  isRolling = true;
  rollBtn.disabled = true;

  const roll = randomRoll(game.dice);

  animateDice(roll, game.dice, () => {
    const finalResult = calculateFinalResult(roll);

    game.displayFace = roll;
    game.finalResult = finalResult;
    game.gold += finalResult;

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

  if (!game.autoroll) return;

  autoRollInterval = setInterval(() => {
    if (!isRolling) {
      rollDice();
    }
  }, 2000);
}

function unlockSlot(slotNumber) {
  if (slotNumber === 2 && game.unlockedSlots < 2 && game.gold >= SLOT_COSTS[2]) {
    game.gold -= SLOT_COSTS[2];
    game.unlockedSlots = 2;
    return true;
  }

  if (slotNumber === 3 && game.unlockedSlots < 3 && game.gold >= SLOT_COSTS[3]) {
    game.gold -= SLOT_COSTS[3];
    game.unlockedSlots = 3;
    return true;
  }

  return false;
}

function cycleCardInSlot(slotIndex) {
  const availableCards = game.ownedCards.slice();

  if (!availableCards.length) return false;

  const currentCard = game.equippedCards[slotIndex];
  const cycleOptions = [null, ...availableCards];
  const currentIndex = cycleOptions.indexOf(currentCard);
  const nextIndex = (currentIndex + 1) % cycleOptions.length;
  const nextCard = cycleOptions[nextIndex];

  if (nextCard && game.equippedCards.includes(nextCard)) {
    const otherIndex = game.equippedCards.indexOf(nextCard);
    game.equippedCards[otherIndex] = currentCard;
  }

  game.equippedCards[slotIndex] = nextCard;
  return true;
}

function handleSlotClick(slotNumber) {
  const slotIndex = slotNumber - 1;

  if (game.unlockedSlots < slotNumber) {
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
  window.location.href = "shop.html";
});

slot1.addEventListener("click", () => handleSlotClick(1));
slot2.addEventListener("click", () => handleSlotClick(2));
slot3.addEventListener("click", () => handleSlotClick(3));

applyOfflineProgress();

if (!game.displayFace || game.displayFace > game.dice) {
  game.displayFace = 1;
}

updateUI();
startAutoRoll();
setInterval(saveGame, 5000);