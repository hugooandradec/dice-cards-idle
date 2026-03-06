const STORAGE_KEY = "diceCardsIdle_v03";

const COSTS = {
  dice8: 250,
  dice10: 800,
  luck: 80,
  crit: 120,
  even: 200,
  autoroll: 300,
  offline: 600
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
const backBtn = document.getElementById("backBtn");
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const buyButtons = document.querySelectorAll("[data-buy]");

let game = loadGame();

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

function isOwnedCard(cardId) {
  return game.ownedCards.includes(cardId);
}

function updateGold() {
  goldEl.textContent = game.gold;
}

function updateShopButtons() {
  buyButtons.forEach((btn) => {
    const item = btn.dataset.buy;
    btn.disabled = false;

    if (item === "dice6") {
      btn.textContent = game.dice === 6 ? "Equipado" : "Equipar";
      return;
    }

    if (item === "dice8") {
      if (game.ownedDice.includes(8)) {
        btn.textContent = game.dice === 8 ? "Equipado" : "Equipar";
      } else {
        btn.textContent = `${COSTS.dice8} ouro`;
      }
      return;
    }

    if (item === "dice10") {
      if (game.ownedDice.includes(10)) {
        btn.textContent = game.dice === 10 ? "Equipado" : "Equipar";
      } else {
        btn.textContent = `${COSTS.dice10} ouro`;
      }
      return;
    }

    if (item === "luck" || item === "crit" || item === "even") {
      btn.textContent = isOwnedCard(item) ? "Comprada" : `${COSTS[item]} ouro`;
      return;
    }

    if (item === "autoroll") {
      btn.textContent = game.autoroll ? "Comprado" : `${COSTS.autoroll} ouro`;
      return;
    }

    if (item === "offline") {
      btn.textContent = game.offline ? "Comprado" : `${COSTS.offline} ouro`;
    }
  });
}

function updateUI() {
  updateGold();
  updateShopButtons();
}

function buyItem(item) {
  switch (item) {
    case "dice6":
      game.dice = 6;
      game.displayFace = Math.min(game.displayFace, 6);
      return true;

    case "dice8":
      if (game.ownedDice.includes(8)) {
        game.dice = 8;
        game.displayFace = Math.min(game.displayFace, 8);
        return true;
      }
      if (game.gold < COSTS.dice8) return false;
      game.gold -= COSTS.dice8;
      game.ownedDice.push(8);
      game.dice = 8;
      game.displayFace = Math.min(game.displayFace, 8);
      return true;

    case "dice10":
      if (game.ownedDice.includes(10)) {
        game.dice = 10;
        game.displayFace = Math.min(game.displayFace, 10);
        return true;
      }
      if (game.gold < COSTS.dice10) return false;
      game.gold -= COSTS.dice10;
      game.ownedDice.push(10);
      game.dice = 10;
      game.displayFace = Math.min(game.displayFace, 10);
      return true;

    case "luck":
    case "crit":
    case "even":
      if (isOwnedCard(item)) return false;
      if (game.gold < COSTS[item]) return false;
      game.gold -= COSTS[item];
      game.ownedCards.push(item);
      return true;

    case "autoroll":
      if (game.autoroll) return false;
      if (game.gold < COSTS.autoroll) return false;
      game.gold -= COSTS.autoroll;
      game.autoroll = true;
      return true;

    case "offline":
      if (game.offline) return false;
      if (game.gold < COSTS.offline) return false;
      game.gold -= COSTS.offline;
      game.offline = true;
      return true;

    default:
      return false;
  }
}

backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
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