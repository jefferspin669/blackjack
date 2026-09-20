const playerCards = document.getElementById("player-cards")
const dealerCards = document.getElementById("dealer-cards")
const bot1Cards = document.getElementById("bot1-cards")
const bot2Cards = document.getElementById("bot2-cards")

const playerScore = document.getElementById("player-score")
const dealerScore = document.getElementById("dealer-score")
const bot1Score = document.getElementById("bot1-score")
const bot2Score = document.getElementById("bot2-score")

const bankrollDisplay = document.getElementById("bankroll")
const currentBetDisplay = document.getElementById("current-bet")
const potDisplay = document.getElementById("pot")
const statsDisplay = document.getElementById("stats")
const goalDisplay = document.getElementById("goal")
const message = document.getElementById("message")

const hitBtn = document.getElementById("hit-btn")
const standBtn = document.getElementById("stand-btn")
const doubleBtn = document.getElementById("double-btn")
const splitBtn = document.getElementById("split-btn")
const newRoundBtn = document.getElementById("new-round-btn")
const insuranceBtn = document.getElementById("insurance-btn")
const sideBetBtn = document.getElementById("side-bet-btn")

const feed = document.getElementById("feed")

/* =========================
   RENDERING
========================= */

function renderHand(container, hand, hideSecond = false){
  container.innerHTML = ""

  hand.forEach((card, i) => {
    const img = document.createElement("img")
    img.className = "card"

    img.src = hideSecond && i === 1
      ? "https://deckofcardsapi.com/static/img/back.png"
      : `https://deckofcardsapi.com/static/img/${cardCode(card)}.png`

    container.appendChild(img)
  })

  const label = resultLabel(hand)

  if(label){
    const div = document.createElement("div")
    div.className = "result-label"
    div.innerText = label
    container.appendChild(div)
  }
}

function renderSplitHands(container, hands, activeIndex){
  container.innerHTML = ""

  hands.forEach((hand, index) => {
    const wrap = document.createElement("div")
    wrap.className = "split-hand"

    if(index === activeIndex && !roundOver){
      wrap.classList.add("active-split-hand")
    }

    const title = document.createElement("div")
    title.className = "split-hand-title"
    title.innerText = "Hand " + (index + 1) + (index === activeIndex && !roundOver ? " (playing)" : "")
    wrap.appendChild(title)

    hand.forEach(card => {
      const img = document.createElement("img")
      img.className = "card"
      img.src = `https://deckofcardsapi.com/static/img/${cardCode(card)}.png`
      wrap.appendChild(img)
    })

    const label = resultLabel(hand, false)

    if(label){
      const div = document.createElement("div")
      div.className = "result-label"
      div.innerText = label
      wrap.appendChild(div)
    }

    container.appendChild(wrap)
  })
}

function resultLabel(hand, allowBlackjack = true){
  if(hand.length === 0) return ""

  const score = handValue(hand)

  if(score > 21) return "BUST"
  if(allowBlackjack && isBlackjack(hand)) return "BLACKJACK"
  if(score === 21) return "21"

  return ""
}

/* =========================
   SCORES + HUD
========================= */

function updateScores(hideDealer = true){
  playerScore.innerText = splitMode
    ? splitHands.map((hand, index) => "Hand " + (index + 1) + " " + handValue(hand)).join(" | ")
    : "Score " + handValue(playerHand)

  dealerScore.innerText = hideDealer
    ? "Score ?"
    : "Score " + handValue(dealerHand)

  bot1Score.innerText = bots[0]
    ? `Score ${handValue(bots[0].hand)} | $${bots[0].bankroll} | Bet $${bots[0].bet}`
    : "Score 0"

  bot2Score.innerText = bots[1]
    ? `Score ${handValue(bots[1].hand)} | $${bots[1].bankroll} | Bet $${bots[1].bet}`
    : "Score 0"
}

function updateHud(){
  bankrollDisplay.innerText = "Bankroll: $" + bankroll
  currentBetDisplay.innerText = splitMode && splitBets.some(bet => bet > 0)
    ? "Current Bets: " + splitBets.map(bet => "$" + bet).join(" + ")
    : "Current Bet: $" + currentBet
  potDisplay.innerText = "Pot: $" + getPot()

  statsDisplay.innerText =
    `Wins: ${stats.wins} | Losses: ${stats.losses} | Pushes: ${stats.pushes} | Streak: ${stats.streak}`

  goalDisplay.innerText =
    `${tableLevel.name} | Min: $${tableLevel.minBet} | Max: $${tableLevel.maxBet} | Goal: $${stats.goal}`
}

/* =========================
   UI CONTROL
========================= */

function setMessage(text){
  message.innerText = text
}

function setButtons(canPlay){
  hitBtn.disabled = !canPlay
  standBtn.disabled = !canPlay
  doubleBtn.disabled = !canPlay || (typeof canDoubleDown === "function" && !canDoubleDown())
  splitBtn.disabled = !canPlay || (typeof canSplit !== "function") || !canSplit()

  if(insuranceBtn){
    insuranceBtn.disabled = !canPlay || dealerHand[0]?.rank !== "A" || insuranceBet > 0
  }

  if(sideBetBtn){
    sideBetBtn.disabled = !roundOver || sideBet > 0
  }
}

/* =========================
   VISUAL EFFECTS
========================= */

function clearGlow(){
  document.querySelectorAll(".seat, #dealer-area").forEach(el => {
    el.classList.remove("winner", "loser", "push", "active-turn")
  })
}

function glowPlayer(type){
  document.querySelector(".seat").classList.add(type)
}

function glowDealer(type){
  document.getElementById("dealer-area").classList.add(type)
}

/* =========================
   FEED (TABLE CHAT)
========================= */

function addFeed(text){
  const line = document.createElement("div")
  line.className = "feed-line"
  line.innerText = text

  feed.prepend(line)

  if(feed.children.length > 6){
    feed.removeChild(feed.lastChild)
  }
}

function resetFeed(){
  feed.innerHTML = ""
}

/* =========================
   TURN HIGHLIGHTING
========================= */

function clearTurnHighlights(){
  document.querySelectorAll(".seat, #dealer-area").forEach(el => {
    el.classList.remove("active-turn")
  })
}

function highlightTurn(type){
  clearTurnHighlights()

  if(type === "player"){
    document.querySelector(".seat").classList.add("active-turn")
  }

  if(type === "dealer"){
    document.getElementById("dealer-area").classList.add("active-turn")
  }

  if(type === "bot1"){
    document.querySelectorAll(".seat")[1].classList.add("active-turn")
  }

  if(type === "bot2"){
    document.querySelectorAll(".seat")[2].classList.add("active-turn")
  }
}

/* =========================
   SOUND + DELAYS
========================= */

function playSound(type){
  const sounds = {
    card: "https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3",
    chip: "https://assets.mixkit.co/active_storage/sfx/2068/2068-preview.mp3",
    win: "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
    lose: "https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3"
  }

  const audio = new Audio(sounds[type])
  audio.volume = 0.35
  audio.play().catch(() => {})
}

function wait(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}

function animateChip(amount){
  const chips = document.querySelectorAll(".chip")

  chips.forEach(chip => {
    if(chip.innerText.includes(amount)){
      chip.classList.add("chip-pop")

      setTimeout(() => {
        chip.classList.remove("chip-pop")
      }, 350)
    }
  })
}
const lobbyLines = [
  "VegasVinnie joined the table.",
  "LuckyLarry says: Feeling dangerous tonight.",
  "CardSharkCarla bought in for $1000.",
  "SilentSam is watching the dealer.",
  "DealerSlayer says: House looks nervous."
]

function startFakeLobby(){
  const online = document.getElementById("online-count")
  const chat = document.getElementById("lobby-chat")

  if(!online || !chat) return

  online.innerText = "Players online: " + Math.floor(12 + Math.random() * 40)

  setInterval(() => {
    chat.innerText = lobbyLines[Math.floor(Math.random() * lobbyLines.length)]
  }, 2500)
}
