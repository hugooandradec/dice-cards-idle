import { DICE_DATA, CARD_DATA } from "./gameData.js";
import {
  loadGame,
  formatRarity,
  getRarityClass,
  stackInventoryItems,
  countEquippedByBaseId
} from "./helpers.js";

const inventoryGoldValue = document.getElementById("inventoryGoldValue");
const inventoryDiceList = document.getElementById("inventoryDiceList");
const inventoryCardList = document.getElementById("inventoryCardList");

const tabs = document.querySelectorAll(".shop-tab");
const panels = {
  dados: document.getElementById("inventory-tab-dados"),
  cartas: document.getElementById("inventory-tab-cartas")
};

let state = loadGame();

function renderGold() {
  inventoryGoldValue.textContent = Math.floor(state.gold);
}

function renderDiceInventory() {
  const stacked = stackInventoryItems(state.inventory.dice);
  inventoryDiceList.innerHTML = "";

  if (!stacked.length) {
    inventoryDiceList.innerHTML = `<div class="empty-state">Nenhum dado no inventário.</div>`;
    return;
  }

  stacked.forEach((entry) => {
    const data = DICE_DATA[entry.baseId];
    const equipped = countEquippedByBaseId(state, "dice", entry.baseId);

    const card = document.createElement("article");
    card.className = "inventory-card";
    card.innerHTML = `
      <div class="inventory-topline">
        <h3>${data.name}</h3>
        <span class="rarity-badge ${getRarityClass(data.rarity)}">${formatRarity(data.rarity)}</span>
      </div>
      <p>d${data.sides}</p>
      <p>${data.description}</p>
      <div class="pool-list">
        <span class="stack-badge">Total x${entry.quantity}</span>
        <span class="stack-badge">Equipado x${equipped}</span>
        <span class="stack-badge">Livre x${entry.quantity - equipped}</span>
      </div>
    `;
    inventoryDiceList.appendChild(card);
  });
}

function renderCardInventory() {
  const stacked = stackInventoryItems(state.inventory.cards);
  inventoryCardList.innerHTML = "";

  if (!stacked.length) {
    inventoryCardList.innerHTML = `<div class="empty-state">Nenhuma carta no inventário.</div>`;
    return;
  }

  stacked.forEach((entry) => {
    const data = CARD_DATA[entry.baseId];
    const equipped = countEquippedByBaseId(state, "card", entry.baseId);

    const card = document.createElement("article");
    card.className = "inventory-card";
    card.innerHTML = `
      <div class="inventory-topline">
        <h3>${data.name}</h3>
        <span class="rarity-badge ${getRarityClass(data.rarity)}">${formatRarity(data.rarity)}</span>
      </div>
      <p>${data.description}</p>
      <div class="pool-list">
        <span class="stack-badge">Total x${entry.quantity}</span>
        <span class="stack-badge">Equipado x${equipped}</span>
        <span class="stack-badge">Livre x${entry.quantity - equipped}</span>
      </div>
    `;
    inventoryCardList.appendChild(card);
  });
}

function activateTab(tabName) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle("active", key === tabName);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

renderGold();
renderDiceInventory();
renderCardInventory();