import {
  createInitialGameState,
  DICE_DATA,
  CARD_DATA,
  SHOP_DATA,
  openRandomDicePack,
  openRandomCardPack
} from "./gameData.js";

const SAVE_KEY = "dice_cards_idle_save";

const shopGoldValue = document.getElementById("shopGoldValue");
const buyRandomDieButton = document.getElementById("buyRandomDieButton");
const buyRandomCardButton = document.getElementById("buyRandomCardButton");
const shopResult = document.getElementById("shopResult");
const dicePoolList = document.getElementById("dicePoolList");
const cardPoolList = document.getElementById("cardPoolList");

const tabs = document.querySelectorAll(".shop-tab");
const tabPanels = document.querySelectorAll(".shop-tab-panel");

let state = loadGame();

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialGameState();

    const parsed = JSON.parse(raw);

    return {
      ...createInitialGameState(),
      ...parsed,
      inventory: {
        ...createInitialGameState().inventory,
        ...(parsed.inventory || {})
      }
    };
  } catch {
    return createInitialGameState();
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function formatRarity(rarity) {
  const map = {
    common: "Comum",
    uncommon: "Incomum",
    rare: "Rara",
    epic: "Épica",
    legendary: "Lendária"
  };

  return map[rarity] || rarity;
}

function renderGold() {
  shopGoldValue.textContent = Math.floor(state.gold);
  buyRandomDieButton.disabled = state.gold < SHOP_DATA.randomDiePrice;
  buyRandomCardButton.disabled = state.gold < SHOP_DATA.randomCardPrice;
}

function renderPools() {
  dicePoolList.innerHTML = "";
  Object.values(DICE_DATA).forEach((die) => {
    const badge = document.createElement("span");
    badge.className = "pool-badge";
    badge.textContent = `${die.name} (d${die.sides})`;
    dicePoolList.appendChild(badge);
  });

  cardPoolList.innerHTML = "";
  Object.values(CARD_DATA).forEach((card) => {
    const badge = document.createElement("span");
    badge.className = "pool-badge";
    badge.textContent = `${card.name} (${formatRarity(card.rarity)})`;
    cardPoolList.appendChild(badge);
  });
}

function showResult(message, muted = false) {
  shopResult.textContent = message;
  shopResult.classList.toggle("muted", muted);
}

function buyRandomDie() {
  if (state.gold < SHOP_DATA.randomDiePrice) {
    showResult("Ouro insuficiente para comprar um dado aleatório.");
    return;
  }

  state.gold -= SHOP_DATA.randomDiePrice;

  const newDie = openRandomDicePack();
  state.inventory.dice.push(newDie);

  const dieData = DICE_DATA[newDie.baseId];

  saveGame();
  renderGold();

  showResult(
    `Você comprou 1 dado aleatório e recebeu: ${dieData.name} (${formatRarity(dieData.rarity)}) - d${dieData.sides}`
  );
}

function buyRandomCard() {
  if (state.gold < SHOP_DATA.randomCardPrice) {
    showResult("Ouro insuficiente para comprar uma carta aleatória.");
    return;
  }

  state.gold -= SHOP_DATA.randomCardPrice;

  const newCard = openRandomCardPack();
  state.inventory.cards.push(newCard);

  const cardData = CARD_DATA[newCard.baseId];

  saveGame();
  renderGold();

  showResult(
    `Você comprou 1 carta aleatória e recebeu: ${cardData.name} (${formatRarity(cardData.rarity)})`
  );
}

function activateTab(tabName) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
  });
});

buyRandomDieButton.addEventListener("click", buyRandomDie);
buyRandomCardButton.addEventListener("click", buyRandomCard);

renderGold();
renderPools();
showResult("Compre alguma coisa e vamos ver se a sorte vem trabalhar hoje.", true);