const STORAGE_KEY = "diceCardsIdleSave";

const elements = {
  gold: document.getElementById("gold"),
  lastRoll: document.getElementById("lastRoll"),
  result: document.getElementById("result"),
  dieDisplay: document.getElementById("dieDisplay"),
  rollButton: document.getElementById("rollButton"),
};

const defaultState = {
  gold: 0,
  dice: [
    { sides: 6 }
  ],
  cards: {
    luck: true,
    crit: true,
  },
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved) {
      return structuredClone(defaultState);
    }

    return {
      gold: Number(saved.gold) || 0,
      dice: Array.isArray(saved.dice) && saved.dice.length
        ? saved.dice
        : structuredClone(defaultState.dice),
      cards: {
        ...defaultState.cards,
        ...(saved.cards || {}),
      },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateUI() {
  elements.gold.textContent = state.gold;
}

function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function applyCardEffects(roll, die) {
  let value = roll;

  if (state.cards.luck) {
    value += 1;
  }

  if (state.cards.crit && roll === die.sides) {
    value *= 2;
  }

  return value;
}

function animateSingleDie(finalRoll, sides, onComplete) {
  let steps = 0;
  const totalSteps = 10;
  const intervalTime = 80;

  const interval = setInterval(() => {
    elements.dieDisplay.textContent = rollDice(sides);
    steps++;

    if (steps >= totalSteps) {
      clearInterval(interval);
      elements.dieDisplay.textContent = finalRoll;
      onComplete();
    }
  }, intervalTime);
}

function rollAll() {
  if (!state.dice.length) return;

  elements.rollButton.disabled = true;

  const die = state.dice[0];
  const roll = rollDice(die.sides);

  animateSingleDie(roll, die.sides, () => {
    const finalValue = applyCardEffects(roll, die);

    state.gold += finalValue;

    elements.lastRoll.textContent = roll;
    elements.result.textContent = finalValue;
    updateUI();
    saveState();

    elements.rollButton.disabled = false;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Service Worker registrado"))
      .catch((error) => console.log("Erro ao registrar SW:", error));
  });
}

function init() {
  updateUI();
  registerServiceWorker();

  elements.rollButton.addEventListener("click", rollAll);
}

init();