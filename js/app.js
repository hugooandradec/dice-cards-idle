import { DICE_DATA, CARD_DATA } from "./gameData.js";
import {
  loadGame,
  saveGame,
  getOwnedDieByUid,
  getOwnedCardByUid,
  getEquippedCardEffects,
  stackInventoryItems,
  getDisplayData,
  countEquippedByBaseId,
  formatRarity,
  getRarityClass
} from "./helpers.js";

let state = loadGame();

const goldValue = document.getElementById("goldValue");
const rollGain = document.getElementById("rollGain");
const rollSlotsPreview = document.getElementById("rollSlotsPreview");
const rollButton = document.getElementById("rollButton");

const diceSlotsEl = document.getElementById("diceSlots");
const cardSlotsEl = document.getElementById("cardSlots");

const equipModal = document.getElementById("equipModal");
const modalTitle = document.getElementById("modalTitle");
const modalList = document.getElementById("modalList");
const closeModalButton = document.getElementById("closeModalButton");

let currentModalContext = null;

function renderTop() {
  goldValue.textContent = Math.floor(state.gold);
  rollGain.textContent = `+${Math.floor(state.lastRollGain || 0)} ouro`;
  renderRollSlotsPreview();
}

function renderRollSlotsPreview() {
  const slotValues = Array.isArray(state.lastRollSlots)
    ? state.lastRollSlots
    : [null, null, null, null, null];

  const total = slotValues.reduce((sum, value) => sum + (Number(value) || 0), 0);

  rollSlotsPreview.innerHTML = "";

  slotValues.forEach((value, index) => {
    const box = document.createElement("div");
    box.className = `roll-slot-box ${value == null ? "empty" : ""}`;
    box.innerHTML = `
      <div class="roll-slot-label">S${index + 1}</div>
      <div class="roll-slot-value">${value == null ? "-" : value}</div>
    `;
    rollSlotsPreview.appendChild(box);
  });

  const equals = document.createElement("div");
  equals.className = "roll-equals";
  equals.textContent = "=";
  rollSlotsPreview.appendChild(equals);

  const totalBox = document.createElement("div");
  totalBox.className = "roll-total-box";
  totalBox.innerHTML = `
    <div class="roll-slot-label">TOTAL</div>
    <div class="roll-total-value">${total}</div>
  `;
  rollSlotsPreview.appendChild(totalBox);
}

function renderDiceSlots() {
  diceSlotsEl.innerHTML = "";

  state.equippedDice.forEach((uid, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-chip";
    button.dataset.action = "dice-slot";
    button.dataset.slotIndex = index;

    if (!uid) {
      button.classList.add("empty");
      button.textContent = "+";
    } else {
      const dieItem = getOwnedDieByUid(state, uid);
      const dieData = dieItem ? DICE_DATA[dieItem.baseId] : null;
      button.textContent = dieData ? `d${dieData.sides}` : "?";
      button.title = dieData?.name || "Dado";
    }

    diceSlotsEl.appendChild(button);
  });
}

function renderCardSlots() {
  cardSlotsEl.innerHTML = "";

  state.equippedCards.forEach((uid, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-chip card";
    button.dataset.action = "card-slot";
    button.dataset.slotIndex = index;

    if (!uid) {
      button.classList.add("empty");
      button.textContent = "+";
    } else {
      const cardItem = getOwnedCardByUid(state, uid);
      const cardData = cardItem ? CARD_DATA[cardItem.baseId] : null;
      button.textContent = cardData?.name || "?";
      button.title = cardData?.name || "Carta";
    }

    cardSlotsEl.appendChild(button);
  });
}

function renderAll() {
  renderTop();
  renderDiceSlots();
  renderCardSlots();

  const hasAnyDie = state.equippedDice.some(Boolean);
  rollButton.disabled = !hasAnyDie;
  rollButton.style.opacity = hasAnyDie ? "1" : "0.6";
  rollButton.style.cursor = hasAnyDie ? "pointer" : "not-allowed";
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function processRoll() {
  const effects = getEquippedCardEffects(state);

  let flatPerDie = 0;
  let critChance = 0;
  let goldMultiplier = 1;
  let rerollOnOneCount = 0;

  effects.forEach((effect) => {
    if (effect.type === "flatPerDie") flatPerDie += effect.value;
    if (effect.type === "critChance") critChance += effect.value;
    if (effect.type === "goldMultiplier") goldMultiplier *= effect.value;
    if (effect.type === "rerollOnOne") rerollOnOneCount += effect.value;
  });

  let rerollsLeft = rerollOnOneCount;
  const slotResults = [];

  state.equippedDice.forEach((uid) => {
    if (!uid) {
      slotResults.push(null);
      return;
    }

    const dieItem = getOwnedDieByUid(state, uid);
    const dieData = dieItem ? DICE_DATA[dieItem.baseId] : null;

    if (!dieData) {
      slotResults.push(null);
      return;
    }

    let result = rollDie(dieData.sides);

    if (result === 1 && rerollsLeft > 0) {
      result = rollDie(dieData.sides);
      rerollsLeft -= 1;
    }

    result += flatPerDie;
    slotResults.push(result);
  });

  let total = slotResults.reduce((sum, value) => sum + (Number(value) || 0), 0);

  if (Math.random() < critChance) {
    total *= 2;
    for (let i = 0; i < slotResults.length; i += 1) {
      if (slotResults[i] != null) slotResults[i] *= 2;
    }
  }

  total = Math.floor(total * goldMultiplier);

  if (goldMultiplier > 1) {
    const baseWithoutMultiplier = slotResults.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const multiplierFactor = total / (baseWithoutMultiplier || 1);

    for (let i = 0; i < slotResults.length; i += 1) {
      if (slotResults[i] != null) {
        slotResults[i] = Math.floor(slotResults[i] * multiplierFactor);
      }
    }

    const adjustedTotal = slotResults.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const diff = total - adjustedTotal;
    const lastFilledIndex = [...slotResults]
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value != null)
      .pop()?.index;

    if (diff !== 0 && lastFilledIndex != null) {
      slotResults[lastFilledIndex] += diff;
    }
  }

  state.gold += total;
  state.lastRollGain = total;
  state.lastRollSlots = slotResults;

  saveGame(state);
  renderAll();
}

function openEquipModal(type, slotIndex) {
  currentModalContext = { type, slotIndex };
  modalTitle.textContent = type === "dice"
    ? `Equipar dado no Slot ${slotIndex + 1}`
    : `Equipar carta no Slot ${slotIndex + 1}`;

  const currentUid = type === "dice"
    ? state.equippedDice[slotIndex]
    : state.equippedCards[slotIndex];

  const stacked = stackInventoryItems(type === "dice" ? state.inventory.dice : state.inventory.cards);

  modalList.innerHTML = "";

  if (currentUid) {
    const currentItem = type === "dice"
      ? getOwnedDieByUid(state, currentUid)
      : getOwnedCardByUid(state, currentUid);

    const currentData = currentItem ? getDisplayData(type, currentItem.baseId) : null;

    const currentCard = document.createElement("div");
    currentCard.className = "modal-card";
    currentCard.innerHTML = `
      <div class="modal-topline">
        <strong>Equipado atualmente</strong>
        <span class="rarity-badge ${getRarityClass(currentData?.rarity)}">${formatRarity(currentData?.rarity)}</span>
      </div>
      <div><strong>${currentData?.name || "Item"}</strong></div>
      <div>${currentData?.description || ""}</div>
      <button data-action="unequip-current">Desequipar</button>
    `;
    modalList.appendChild(currentCard);
  }

  if (!stacked.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nenhum item disponível.";
    modalList.appendChild(empty);
  }

  stacked.forEach((entry) => {
    const data = getDisplayData(type, entry.baseId);
    const equippedCount = countEquippedByBaseId(state, type, entry.baseId);
    const availableCount = entry.quantity - equippedCount + (currentUid && ((type === "dice" ? getOwnedDieByUid(state, currentUid) : getOwnedCardByUid(state, currentUid))?.baseId === entry.baseId) ? 1 : 0);

    const card = document.createElement("div");
    card.className = "modal-card";
    card.innerHTML = `
      <div class="modal-topline">
        <strong>${data?.name || "Item"}</strong>
        <span class="rarity-badge ${getRarityClass(data?.rarity)}">${formatRarity(data?.rarity)}</span>
      </div>
      <div>${type === "dice" ? `d${data?.sides}` : data?.description || ""}</div>
      <div class="pool-list">
        <span class="stack-badge">Total x${entry.quantity}</span>
        <span class="stack-badge">Disponível x${Math.max(availableCount, 0)}</span>
      </div>
      <button data-action="equip-stack" data-type="${type}" data-base-id="${entry.baseId}" ${availableCount <= 0 ? "disabled" : ""}>
        Equipar
      </button>
    `;
    modalList.appendChild(card);
  });

  equipModal.classList.remove("hidden");
}

function equipFromStack(type, baseId) {
  if (!currentModalContext || currentModalContext.type !== type) return;

  const slotIndex = currentModalContext.slotIndex;
  const currentSlots = type === "dice" ? state.equippedDice : state.equippedCards;
  const inventory = type === "dice" ? state.inventory.dice : state.inventory.cards;
  const getOwned = type === "dice" ? getOwnedDieByUid : getOwnedCardByUid;

  const currentUid = currentSlots[slotIndex];
  const usedUids = new Set(currentSlots.filter(Boolean));

  if (currentUid) usedUids.delete(currentUid);

  const candidate = inventory.find((item) => item.baseId === baseId && !usedUids.has(item.uid));

  if (!candidate) return;

  currentSlots[slotIndex] = candidate.uid;

  saveGame(state);
  closeModal();
  renderAll();
}

function unequipCurrent() {
  if (!currentModalContext) return;

  if (currentModalContext.type === "dice") {
    state.equippedDice[currentModalContext.slotIndex] = null;
  } else {
    state.equippedCards[currentModalContext.slotIndex] = null;
  }

  saveGame(state);
  closeModal();
  renderAll();
}

function closeModal() {
  equipModal.classList.add("hidden");
  currentModalContext = null;
}

rollButton.addEventListener("click", processRoll);

diceSlotsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='dice-slot']");
  if (!button) return;
  openEquipModal("dice", Number(button.dataset.slotIndex));
});

cardSlotsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='card-slot']");
  if (!button) return;
  openEquipModal("card", Number(button.dataset.slotIndex));
});

modalList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "unequip-current") {
    unequipCurrent();
    return;
  }

  if (action === "equip-stack") {
    equipFromStack(button.dataset.type, button.dataset.baseId);
  }
});

closeModalButton.addEventListener("click", closeModal);

equipModal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") closeModal();
});

renderAll();