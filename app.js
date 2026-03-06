const goldEl = document.getElementById("gold")
const diceEl = document.getElementById("dice")
const rollBtn = document.getElementById("rollBtn")

const lastRollEl = document.getElementById("lastRoll")
const finalResultEl = document.getElementById("finalResult")

const shopBtn = document.getElementById("shopBtn")
const shopModal = document.getElementById("shopModal")
const closeShop = document.getElementById("closeShop")

const tabs = document.querySelectorAll(".tab")
const tabContents = document.querySelectorAll(".tab-content")

const slot1 = document.getElementById("slot1")
const slot2 = document.getElementById("slot2")
const slot3 = document.getElementById("slot3")

let game = {
gold:0,

dice:6,

ownedDice:[6],

ownedCards:[],

equippedCards:[null,null,null],

unlockedSlots:1,

autoroll:false,

offline:false,

lastSave:Date.now()
}

let autoRollInterval = null



// =====================
// SAVE
// =====================

function saveGame(){

game.lastSave = Date.now()

localStorage.setItem("diceIdleSave",JSON.stringify(game))

}

function loadGame(){

const save = localStorage.getItem("diceIdleSave")

if(!save) return

game = JSON.parse(save)

}



function applyOfflineProgress(){

if(!game.offline) return

const now = Date.now()

const diff = now - game.lastSave

const seconds = Math.floor(diff / 1000)

const capped = Math.min(seconds, 8 * 3600)

const gain = Math.floor(capped * 0.5)

game.gold += gain

}



// =====================
// DICE
// =====================

function rollDice(){

let roll = Math.floor(Math.random()*game.dice)+1

lastRollEl.textContent = roll

let result = roll



if(game.equippedCards.includes("luck")){
result += 1
}



if(game.equippedCards.includes("crit") && roll === game.dice){
result *= 2
}



if(game.equippedCards.includes("even") && roll % 2 === 0){
result *= 2
}



finalResultEl.textContent = result

game.gold += result

updateUI()

saveGame()

}



rollBtn.onclick = rollDice



// =====================
// AUTOROLL
// =====================

function startAutoRoll(){

if(!game.autoroll) return

autoRollInterval = setInterval(()=>{

rollDice()

},2000)

}



// =====================
// SHOP
// =====================

shopBtn.onclick = ()=>{

shopModal.classList.remove("hidden")

}

closeShop.onclick = ()=>{

shopModal.classList.add("hidden")

}



tabs.forEach(tab=>{

tab.onclick=()=>{

tabs.forEach(t=>t.classList.remove("active"))

tab.classList.add("active")

const target = tab.dataset.tab

tabContents.forEach(c=>{

c.classList.remove("active")

})

document.getElementById(target).classList.add("active")

}

})



// =====================
// BUY SYSTEM
// =====================

document.querySelectorAll("[data-buy]").forEach(btn=>{

btn.onclick=()=>{

const item = btn.dataset.buy



// ===== DICE =====

if(item==="dice8" && game.gold>=250){

game.gold -=250

game.dice = 8

game.ownedDice.push(8)

}



if(item==="dice10" && game.gold>=800){

game.gold -=800

game.dice = 10

game.ownedDice.push(10)

}



// ===== CARDS =====

if(item==="luck" && game.gold>=80){

game.gold -=80

game.ownedCards.push("luck")

}



if(item==="crit" && game.gold>=120){

game.gold -=120

game.ownedCards.push("crit")

}



if(item==="even" && game.gold>=200){

game.gold -=200

game.ownedCards.push("even")

}



// ===== UNLOCKS =====

if(item==="autoroll" && game.gold>=300){

game.gold -=300

game.autoroll=true

startAutoRoll()

}



if(item==="offline" && game.gold>=600){

game.gold -=600

game.offline=true

}



updateUI()

saveGame()

}

})



// =====================
// SLOTS
// =====================

slot1.onclick=()=>equipCard(0)
slot2.onclick=()=>unlockSlot(2)
slot3.onclick=()=>unlockSlot(3)



function unlockSlot(slot){

if(slot===2 && game.unlockedSlots<2 && game.gold>=150){

game.gold -=150

game.unlockedSlots=2

}



if(slot===3 && game.unlockedSlots<3 && game.gold>=400){

game.gold -=400

game.unlockedSlots=3

}

updateUI()

saveGame()

}



function equipCard(slot){

if(!game.ownedCards.length) return

const card = game.ownedCards[0]

game.equippedCards[slot] = card

updateUI()

saveGame()

}



// =====================
// UI
// =====================

function updateUI(){

goldEl.textContent = game.gold

diceEl.textContent = Math.floor(Math.random()*game.dice)+1



slot1.textContent = game.equippedCards[0] || "Slot 1"



if(game.unlockedSlots>=2){

slot2.classList.remove("locked")

slot2.textContent = game.equippedCards[1] || "Slot 2"

}



if(game.unlockedSlots>=3){

slot3.classList.remove("locked")

slot3.textContent = game.equippedCards[2] || "Slot 3"

}

}



// =====================
// INIT
// =====================

loadGame()

applyOfflineProgress()

updateUI()

startAutoRoll()

setInterval(saveGame,5000)