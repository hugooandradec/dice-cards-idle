import { createInitialGameState, DICE_DATA, CARD_DATA } from "./gameData.js";

const SAVE_KEY = "dice_cards_idle_save";

let state = loadGame();

const goldValue = document.getElementById("goldValue");
const mainRollResult = document.getElementById("mainRollResult");
const rollGain = document.getElementById("rollGain");
const rollBreakdown = document.getElementById("rollBreakdown");
const rollButton = document.getElementById("rollButton");

const diceSlotsEl = document.getElementById("diceSlots");
const cardSlotsEl = document.getElementById("cardSlots");

const equipModal = document.getElementById("equipModal");
const modalTitle = document.getElementById("modalTitle");
const modalList = document.getElementById("modalList");
const closeModalButton = document.getElementById("closeModalButton");

let currentModalContext = null;

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialGameState();

    const parsed = JSON.parse(raw);

    return {
      ...createInitialGameState(),
      ...parsed
    };
  } catch {
    return createInitialGameState();
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function getRarityClass(rarity) {
  return `rarity-${rarity || "common"}`;
}

function getOwnedDieByUid(uid) {
  return state.inventory.dice.find((item) => item.uid === uid) || null;
}

function getOwnedCardByUid(uid) {
  return state.inventory.cards.find((item) => item.uid === uid) || null;
}

function getEquippedCardEffects() {
  return state.equippedCards
    .map((uid) => getOwnedCardByUid(uid))
    .filter(Boolean)
    .map((card) => CARD_DATA[card.baseId]?.effect)
    .filter(Boolean);
}

function renderTop() {
  goldValue.textContent = Math.floor(state.gold);
  mainRollResult.textContent = state.lastRollTotal ?? "-";
  rollGain.textContent = `+${Math.floor(state.lastRollGain || 0)} ouro`;
  rollBreakdown.textContent = state.lastRollBreakdown || "";
}

function renderDiceSlots() {
  diceSlotsEl.innerHTML = "";

  state.equippedDice.forEach((uid, index) => {
    const slot = document.createElement("div");
    slot.className = "dice-slot";

    if (uid) {
      const dieItem = getOwnedDieByUid(uid);
      const dieData = dieItem ? DICE_DATA[dieItem.baseId] : null;

      slot.innerHTML = `
        <div class="dice-slot-header">
          <span class="slot-label">Slot ${index + 1}</span>
          <span class="rarity-badge ${getRarityClass(dieData?.rarity)}">${formatRarity(dieData?.rarity)}</span>
        </div>

        <div class="dice-face">${dieData?.sides || "?"}</div>

        <div class="slot-name">${dieData?.name || "Dado"}</div>
        <div class="slot-desc">${dieData?.description || ""}</div>

        <button class="slot-mini-btn unequip" data-dice-slot="${index}" data-action="unequip-die">
          Desequipar
        </button>
      `;
    } else {
      slot.innerHTML = `
        <div class="dice-slot-header">
          <span class="slot-label">Slot ${index + 1}</span>
          <span class="rarity-badge">Vazio</span>
        </div>

        <div class="dice-face">?</div>
        <div class="slot-name slot-empty">Sem dado</div>
        <div class="slot-desc slot-empty">Nenhum dado equipado neste slot.</div>

        <button class="slot-mini-btn equip" data-dice-slot="${index}" data-action="open-dice-modal">
          Equipar
        </button>
      `;
    }

    diceSlotsEl.appendChild(slot);
  });
}

function renderCardSlots() {
  cardSlotsEl.innerHTML = "";

  state.equippedCards.forEach((uid, index) => {
    const slot = document.createElement("div");
    slot.className = "card-slot";

    if (uid) {
      const cardItem = getOwnedCardByUid(uid);
      const cardData = cardItem ? CARD_DATA[cardItem.baseId] : null;

      slot.innerHTML = `
        <div class="card-slot-header">
          <span class="slot-label">Slot ${index + 1}</span>
          <span class="rarity-badge ${getRarityClass(cardData?.rarity)}">${formatRarity(cardData?.rarity)}</span>
        </div>

        <div class="card-art">${cardData?.name || "Carta"}</div>

        <div class="slot-name">${cardData?.name || "Carta"}</div>
        <div class="slot-desc">${cardData?.description || ""}</div>

        <button class="slot-mini-btn unequip" data-card-slot="${index}" data-action="unequip-card">
          Desequipar
        </button>
      `; 
    } else {
      slot.innerHTML = `
        <div class="card-slot-header">
          <span class="slot-label">Slot ${index + 1}</span>
          <span class="rarity-badge">Vazio</span>
        </div>

        <div class="card-art slot-empty">Sem Carta</div>

        <div class="slot-name slot-empty">Slot vazio</div>
        <div class="slot-desc slot-empty">Clique em equipar para escolher uma carta do inventário.</div>

        <button class="slot-mini-btn equip" data-card-slot="${index}" data-action="open-card-modal">
          Equipar
        </button>
      `;
    }

    cardSlotsEl.appendChild(slot);
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

function formatRarity(rarity) {
  const map = {
    common: "Comum",
    uncommon: "Incomum",
    rare: "Rara",
    epic: "Épica",
    legendary: "Lendária"
  };
  return map[rarity] || "Comum";
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function processRoll() {
  const equippedDiceItems = state.equippedDice
    .map((uid) => getOwnedDieByUid(uid))
    .filter(Boolean);

  if (!equippedDiceItems.length) return;

  const effects = getEquippedCardEffects();

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

  const breakdownParts = [];
  let total = 0;
  let rerollsLeft = rerollOnOneCount;

  equippedDiceItems.forEach((dieItem, idx) => {
    const dieData = DICE_DATA[dieItem.baseId];
    if (!dieData) return;

    let result = rollDie(dieData.sides);
    const original = result;

    if (result === 1 && rerollsLeft > 0) {
      result = rollDie(dieData.sides);
      rerollsLeft -= 1;
      breakdownParts.push(`${dieData.name} ${idx + 1}: ${original}↺${result}`);
    } else {
      breakdownParts.push(`${dieData.name} ${idx + 1}: ${result}`);
    }

    total += result + flatPerDie;
  });

  let critTriggered = false;
  if (Math.random() < critChance) {
    total *= 2;
    critTriggered = true;
  }

  total = Math.floor(total * goldMultiplier);

  state.gold += total;
  state.lastRollTotal = total;
  state.lastRollGain = total;

  const extraParts = [];
  if (flatPerDie > 0) extraParts.push(`+${flatPerDie} por dado`);
  if (goldMultiplier > 1) extraParts.push(`x${goldMultiplier.toFixed(2)} ouro`);
  if (critTriggered) extraParts.push("CRÍTICO!");

  state.lastRollBreakdown = [
    breakdownParts.join(" | "),
    extraParts.join(" | ")
  ].filter(Boolean).join(" • ");

  saveGame();
  renderAll();
}

function getAvailableCardsToEquip() {
  const equippedSet = new Set(state.equippedCards.filter(Boolean));
  return state.inventory.cards.filter((card) => !equippedSet.has(card.uid));
}

function getAvailableDiceToEquip() {
  const equippedSet = new Set(state.equippedDice.filter(Boolean));
  return state.inventory.dice.filter((die) => !equippedSet.has(die.uid));
}

function openCardModal(slotIndex) {
  currentModalContext = { type: "card", slotIndex };
  modalTitle.textContent = `Equipar carta no Slot ${slotIndex + 1}`;

  const availableCards = getAvailableCardsToEquip();

  if (!availableCards.length) {
    modalList.innerHTML = `<div class="empty-modal">Nenhuma carta disponível para equipar.</div>`;
    equipModal.classList.remove("hidden");
    return;
  }

  modalList.innerHTML = "";

  availableCards.forEach((cardItem) => {
    const cardData = CARD_DATA[cardItem.baseId];
    const cardEl = document.createElement("div");
    cardEl.className = "modal-card";

    cardEl.innerHTML = `
      <div class="dice-slot-header">
        <span class="modal-card-title">${cardData?.name || "Carta"}</span>
        <span class="rarity-badge ${getRarityClass(cardData?.rarity)}">${formatRarity(cardData?.rarity)}</span>
      </div>

      <div class="modal-card-desc">${cardData?.description || ""}</div>
      <button data-equip-card-uid="${cardItem.uid}">Equipar</button>
    `;

    modalList.appendChild(cardEl);
  });

  equipModal.classList.remove("hidden");
}

function openDiceModal(slotIndex) {
  currentModalContext = { type: "dice", slotIndex };
  modalTitle.textContent = `Equipar dado no Slot ${slotIndex + 1}`;

  const availableDice = getAvailableDiceToEquip();

  if (!availableDice.length) {
    modalList.innerHTML = `<div class="empty-modal">Nenhum dado disponível para equipar.</div>`;
    equipModal.classList.remove("hidden");
    return;
  }

  modalList.innerHTML = "";

  availableDice.forEach((dieItem) => {
    const dieData = DICE_DATA[dieItem.baseId];
    const dieEl = document.createElement("div");
    dieEl.className = "modal-card";

    dieEl.innerHTML = `
      <div class="dice-slot-header">
        <span class="modal-card-title">${dieData?.name || "Dado"}</span>
        <span class="rarity-badge ${getRarityClass(dieData?.rarity)}">${formatRarity(dieData?.rarity)}</span>
      </div>

      <div class="modal-card-desc">${dieData?.description || ""}<br><strong>d${dieData?.sides || 6}</strong></div>
      <button data-equip-dice-uid="${dieItem.uid}">Equipar</button>
    `;

    modalList.appendChild(dieEl);
  });

  equipModal.classList.remove("hidden");
}

function closeModal() {
  equipModal.classList.add("hidden");
  currentModalContext = null;
}

function equipCard(cardUid) {
  if (!currentModalContext || currentModalContext.type !== "card") return;

  const { slotIndex } = currentModalContext;
  state.equippedCards[slotIndex] = cardUid;

  saveGame();
  renderAll();
  closeModal();
}

function equipDie(dieUid) {
  if (!currentModalContext || currentModalContext.type !== "dice") return;

  const { slotIndex } = currentModalContext;
  state.equippedDice[slotIndex] = dieUid;

  saveGame();
  renderAll();
  closeModal();
}

function unequipCard(slotIndex) {
  state.equippedCards[slotIndex] = null;
  saveGame();
  renderAll();
}

function unequipDie(slotIndex) {
  state.equippedDice[slotIndex] = null;
  saveGame();
  renderAll();
}

rollButton.addEventListener("click", processRoll);

cardSlotsEl.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const slotIndex = Number(event.target.dataset.cardSlot);

  if (action === "open-card-modal") {
    openCardModal(slotIndex);
  }

  if (action === "unequip-card") {
    unequipCard(slotIndex);
  }
});

diceSlotsEl.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const slotIndex = Number(event.target.dataset.diceSlot);

  if (action === "open-dice-modal") {
    openDiceModal(slotIndex);
  }

  if (action === "unequip-die") {
    unequipDie(slotIndex);
  }
});

modalList.addEventListener("click", (event) => {
  const cardUid = event.target.dataset.equipCardUid;
  const diceUid = event.target.dataset.equipDiceUid;

  if (cardUid) {
    equipCard(cardUid);
  }

  if (diceUid) {
    equipDie(diceUid);
  }
});

closeModalButton.addEventListener("click", closeModal);

equipModal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") {
    closeModal();
  }
});

renderAll();