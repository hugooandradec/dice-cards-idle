import {
  createInitialGameState,
  openRandomDicePack,
  openRandomCardPack
} from "./gameData.js";

const STORAGE_KEY = "diceCardsIdle_v04";

const COSTS = {
  dicePack: 100,
  cardPack: 120,
  autoroll: 300,
  offline: 600
};

const goldEl = document.getElementById("gold");
const backBtn = document.getElementById("backBtn");
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const buyButtons = document.querySelectorAll("[data-buy]");

let game = loadGame();

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

function updateGold() {
  goldEl.textContent = game.resources.gold;
}

function updateShopButtons() {
  buyButtons.forEach((btn) => {
    const item = btn.dataset.buy;

    if (item === "dice6") {
      btn.textContent = "Inicial";
      return;
    }

    if (item === "dice8") {
      btn.textContent = "Pack de dado";
      return;
    }

    if (item === "dice10") {
      btn.textContent = `${COSTS.dicePack} ouro`;
      return;
    }

    if (item === "luck" || item === "crit" || item === "even") {
      btn.textContent = `${COSTS.cardPack} ouro`;
      return;
    }

    if (item === "autoroll") {
      btn.textContent = game.progression.autoRollUnlocked ? "Comprado" : `${COSTS.autoroll} ouro`;
      return;
    }

    if (item === "offline") {
      btn.textContent = game.progression.offlineGainUnlocked ? "Comprado" : `${COSTS.offline} ouro`;
    }
  });
}

function updateUI() {
  updateGold();
  updateShopButtons();
}

function buyItem(item) {
  switch (item) {
    case "dice8":
    case "dice10":
      if (game.resources.gold < COSTS.dicePack) return false;
      game.resources.gold -= COSTS.dicePack;
      openRandomDicePack(game);
      return true;

    case "luck":
    case "crit":
    case "even":
      if (game.resources.gold < COSTS.cardPack) return false;
      game.resources.gold -= COSTS.cardPack;
      openRandomCardPack(game);
      return true;

    case "autoroll":
      if (game.progression.autoRollUnlocked) return false;
      if (game.resources.gold < COSTS.autoroll) return false;
      game.resources.gold -= COSTS.autoroll;
      game.progression.autoRollUnlocked = true;
      return true;

    case "offline":
      if (game.progression.offlineGainUnlocked) return false;
      if (game.resources.gold < COSTS.offline) return false;
      game.resources.gold -= COSTS.offline;
      game.progression.offlineGainUnlocked = true;
      return true;

    default:
      return false;
  }
}

backBtn.addEventListener("click", () => {
  window.location.href = "./index.html";
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((btn) => btn.classList.remove("active"));
    tab.classList.add("active");

    const targetId = tab.dataset.tab;

    tabContents.forEach((content) => {
      content.classList.remove("active");
    });

    const activeContent = document.getElementById(targetId);
    if (activeContent) {
      activeContent.classList.add("active");
    }
  });
});

buyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const bought = buyItem(btn.dataset.buy);
    if (!bought) return;

    updateUI();
    saveGame();
  });
});

updateUI();