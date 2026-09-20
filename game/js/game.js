let playerHand = []
let dealerHand = []

let bankroll = 1000
let currentBet = 0
let roundOver = true
let dealerHidden = true

let sideBet = 0
let insuranceBet = 0

let splitMode = false
let splitHands = []
let splitBets = []
let activeSplitHand = 0

let stats = {
  wins: 0,
  losses: 0,
  pushes: 0,
  streak: 0,
  biggestWin: 0,
  goal: 10000
}

let tableLevel = {
  name: "Low Roller",
  minBet: 10,
  maxBet: 100,
  unlockAt: 0
}

const tableLevels = [
  { name: "Low Roller", minBet: 10, maxBet: 100, unlockAt: 0 },
  { name: "High Stakes", minBet: 50, maxBet: 500, unlockAt: 2500 },
  { name: "VIP Room", minBet: 100, maxBet: 1000, unlockAt: 5000 }
]

function startGame(){
  document.getElementById("menu").style.display = "none"
  document.getElementById("table").style.display = "block"

  loadGame()
  createDeck()
  shuffleDeck()
  initBots()
  initBackend()

  setButtons(false)
  updateHud()
  setMessage("Place your bet to begin.")
}

function dealInitial(){
  clearGlow()

  playerHand = [drawCard(), drawCard()]
  dealerHand = [drawCard(), drawCard()]

  bots.forEach(bot => {
    bot.hand = [drawCard(), drawCard()]
    bot.bet = botBet(bot)
    bot.result = ""
  })

  roundOver = false
  dealerHidden = true

  renderAll(true)
  setButtons(true)
  newRoundBtn.style.display = "none"

  if(dealerHand[0].rank === "A"){
    setMessage("Dealer shows Ace. Insurance available.")
    addFeed("Insurance offered.")
  }
  else if(isBlackjack(playerHand)){
    finishRound()
  }
  else {
    setMessage("Your move: hit, stand, or double.")
  }

  loadTableEvent()
}

function renderAll(hideDealer = dealerHidden){
  if(splitMode){
    renderSplitHands(playerCards, splitHands, activeSplitHand)
  } else {
    renderHand(playerCards, playerHand)
  }

  renderHand(dealerCards, dealerHand, hideDealer)

  if(bots[0]) renderHand(bot1Cards, bots[0].hand)
  if(bots[1]) renderHand(bot2Cards, bots[1].hand)

  updateScores(hideDealer)
  updateHud()
}

function getPot(){
  const botPot = bots.reduce((sum, bot) => sum + bot.bet, 0)
  return getPlayerBetTotal() + botPot + sideBet + insuranceBet
}

function getActivePlayerHand(){
  return splitMode ? splitHands[activeSplitHand] : playerHand
}

function getActivePlayerBet(){
  return splitMode ? splitBets[activeSplitHand] : currentBet
}

function getPlayerBetTotal(){
  return splitMode
    ? splitBets.reduce((sum, bet) => sum + bet, 0)
    : currentBet
}

function canSplit(){
  return !roundOver
    && !splitMode
    && playerHand.length === 2
    && cardValue(playerHand[0]) === cardValue(playerHand[1])
    && currentBet > 0
    && currentBet * 2 + sideBet + insuranceBet <= bankroll
}

function canDoubleDown(){
  if(roundOver || currentBet === 0) return false

  const activeBet = getActivePlayerBet()

  return getPlayerBetTotal() + activeBet + sideBet + insuranceBet <= bankroll
}

function finishSplitHand(){
  if(activeSplitHand < splitHands.length - 1){
    activeSplitHand++
    renderAll(true)
    setButtons(true)
    setMessage("Playing split hand " + (activeSplitHand + 1) + ".")
    addFeed("Now playing split hand " + (activeSplitHand + 1) + ".")
    return
  }

  finishRound()
}

function hit(){
  if(roundOver || currentBet === 0) return

  const hand = getActivePlayerHand()

  hand.push(drawCard())
  playSound("card")
  renderAll(true)

  if(handValue(hand) > 21){
    if(splitMode){
      addFeed("Split hand " + (activeSplitHand + 1) + " busts.")
      finishSplitHand()
    } else {
      finishRound()
    }
  }
}

function stand(){
  if(roundOver || currentBet === 0) return

  if(splitMode){
    addFeed("Split hand " + (activeSplitHand + 1) + " stands with " + handValue(getActivePlayerHand()) + ".")
    finishSplitHand()
    return
  }

  finishRound()
}

function doubleDown(){
  if(roundOver || currentBet === 0) return

  if(!canDoubleDown()){
    setMessage("Not enough bankroll to double.")
    return
  }

  const hand = getActivePlayerHand()

  if(splitMode){
    splitBets[activeSplitHand] *= 2
  } else {
    currentBet *= 2
  }

  hand.push(drawCard())
  playSound("card")
  renderAll(true)

  if(splitMode){
    addFeed("Split hand " + (activeSplitHand + 1) + " doubled.")
    finishSplitHand()
    return
  }

  finishRound()
}

function split(){
  if(!canSplit()){
    setMessage("You can only split matching starting cards with enough bankroll.")
    return
  }

  const firstCard = playerHand[0]
  const secondCard = playerHand[1]

  splitMode = true
  splitHands = [
    [firstCard, drawCard()],
    [secondCard, drawCard()]
  ]
  splitBets = [currentBet, currentBet]
  activeSplitHand = 0

  playSound("card")
  addFeed("You split into two hands.")
  setMessage("Playing split hand 1.")
  renderAll(true)
  setButtons(true)
}

function bet(amount){
  if(!roundOver){
    setMessage("Finish this round first.")
    return
  }

  if(sideBet > 0 && amount + sideBet > bankroll){
    setMessage("Not enough money for that bet with your side bet.")
    return
  }

  if(amount > bankroll){
    setMessage("Not enough money.")
    return
  }

  if(amount < tableLevel.minBet){
    setMessage("Minimum bet is $" + tableLevel.minBet + ".")
    return
  }

  if(amount > tableLevel.maxBet){
    setMessage("Maximum bet is $" + tableLevel.maxBet + ".")
    return
  }

  currentBet = amount
  playSound("chip")
  animateChip(amount)
  addFeed("You bet $" + amount + ".")
  setMessage("Bet placed: $" + amount)

  dealInitial()
}

async function finishRound(){
  roundOver = true
  dealerHidden = false
  setButtons(false)

  highlightTurn("dealer")
  addFeed("Dealer reveals their card.")
  playSound("card")

  renderAll(false)
  await wait(700)

  while(handValue(dealerHand) < 17){
    addFeed("Dealer hits.")
    dealerHand.push(drawCard())
    playSound("card")
    renderAll(false)
    await wait(700)
  }

  const dealerTotal = handValue(dealerHand)
  addFeed(
    dealerTotal > 21
      ? "Dealer busts with " + dealerTotal + "."
      : "Dealer stands with " + dealerTotal + "."
  )
  await wait(500)

  for(let i = 0; i < bots.length; i++){
    const bot = bots[i]

    highlightTurn(i === 0 ? "bot1" : "bot2")
    addFeed(bot.name + " is playing...")

    await wait(600)

    while(shouldBotHit(bot)){
      bot.hand.push(drawCard())
      playSound("card")
      addFeed(bot.name + " hits.")
      renderAll(false)
      await wait(600)
    }

    addFeed(bot.name + " stands with " + handValue(bot.hand) + ".")
    resolveBot(bot)
    await wait(500)
  }

  clearTurnHighlights()

  resolveSideBet()
  resolveInsurance()

  const result = resolvePlayerResults()
  updateTableLevel()
  saveGame()

  const botTalk = bots.map(bot => botReaction(bot)).join(" ")

  renderAll(false)

  currentBet = 0
  splitBets = splitBets.map(() => 0)
  bots.forEach(bot => {
    bot.bet = 0
  })
  updateScores(false)
  updateHud()

  addFeed(result)
  syncRoundToBackend(result)

  if(bankroll <= 0){
    setMessage("Game over. You ran out of money.")
    newRoundBtn.style.display = "none"
    return
  }

  if(bankroll >= stats.goal){
    setMessage("You beat the casino! You reached $" + stats.goal + "!")
    newRoundBtn.style.display = "none"
    return
  }

  setMessage(result + " " + botTalk)
  newRoundBtn.style.display = "inline-block"
}

function resolvePlayerResults(){
  const hands = splitMode ? splitHands : [playerHand]
  const bets = splitMode ? splitBets : [currentBet]
  const dealer = handValue(dealerHand)
  const messages = []
  const outcomes = []

  hands.forEach((hand, index) => {
    const bet = bets[index]
    const player = handValue(hand)
    const label = splitMode ? "Hand " + (index + 1) : "You"
    let messageText = ""
    let outcome = ""

    if(player > 21){
      bankroll -= bet
      messageText = label + " busted. You lose $" + bet + "."
      outcome = "loss"
    }
    else if(!splitMode && isBlackjack(hand) && !isBlackjack(dealerHand)){
      const winnings = Math.floor(bet * 1.5)
      bankroll += winnings
      messageText = "Blackjack! You win $" + winnings + "."
      outcome = "win"
      stats.biggestWin = Math.max(stats.biggestWin, winnings)
    }
    else if(dealer > 21){
      bankroll += bet
      messageText = label + " wins $" + bet + "."
      outcome = "win"
      stats.biggestWin = Math.max(stats.biggestWin, bet)
    }
    else if(player > dealer){
      bankroll += bet
      messageText = label + " wins $" + bet + "."
      outcome = "win"
      stats.biggestWin = Math.max(stats.biggestWin, bet)
    }
    else if(player < dealer){
      bankroll -= bet
      messageText = label + " loses $" + bet + "."
      outcome = "loss"
    }
    else {
      messageText = label + " pushes."
      outcome = "push"
    }

    updateStats(outcome)
    outcomes.push(outcome)
    messages.push(messageText)
  })

  const hasWin = outcomes.includes("win")
  const hasLoss = outcomes.includes("loss")
  const hasPush = outcomes.includes("push")

  if(hasWin){
    glowPlayer("winner")
    playSound("win")
  } else if(hasLoss){
    glowPlayer("loser")
    playSound("lose")
  } else if(hasPush){
    glowPlayer("push")
  }

  if(dealer > 21){
    glowDealer("loser")
  } else if(hasLoss && !hasWin && !hasPush){
    glowDealer("winner")
  } else if(hasPush && !hasWin && !hasLoss){
    glowDealer("push")
  }

  return messages.join(" ")
}

function resolveBot(bot){
  const botScore = handValue(bot.hand)
  const dealerScore = handValue(dealerHand)

  if(botScore > 21){
    bot.bankroll -= bot.bet
    bot.result = "loss"
  }
  else if(isBlackjack(bot.hand) && !isBlackjack(dealerHand)){
    bot.bankroll += Math.floor(bot.bet * 1.5)
    bot.result = "blackjack"
  }
  else if(dealerScore > 21 || botScore > dealerScore){
    bot.bankroll += bot.bet
    bot.result = "win"
  }
  else if(botScore < dealerScore){
    bot.bankroll -= bot.bet
    bot.result = "loss"
  }
  else {
    bot.result = "push"
  }

  if(bot.bankroll <= 0){
    bot.bankroll = 0
  }
}

function updateStats(outcome){
  if(outcome === "win"){
    stats.wins++
    stats.streak++
  }

  if(outcome === "loss"){
    stats.losses++
    stats.streak = 0
  }

  if(outcome === "push"){
    stats.pushes++
  }
}

function updateTableLevel(){
  const unlocked = tableLevels
    .filter(level => bankroll >= level.unlockAt)
    .at(-1)

  if(unlocked.name !== tableLevel.name){
    tableLevel = unlocked
    addFeed("Unlocked: " + tableLevel.name + "!")
    setMessage("Welcome to the " + tableLevel.name + ".")
  }
}

function placeSideBet(amount){
  if(!roundOver){
    setMessage("Side bets must be placed before the round.")
    return
  }

  if(amount > bankroll){
    setMessage("Not enough money for side bet.")
    return
  }

  sideBet = amount
  playSound("chip")
  animateChip(amount)
  setMessage("Side bet placed: $" + amount)
  updateHud()
  setButtons(false)
}

function resolveSideBet(){
  if(sideBet === 0) return

  const firstTwo = playerHand.slice(0, 2)

  if(firstTwo[0].rank === firstTwo[1].rank){
    const win = sideBet * 5
    bankroll += win
    addFeed("Side bet won! Pair pays $" + win + ".")
  } else {
    bankroll -= sideBet
    addFeed("Side bet lost.")
  }

  sideBet = 0
}

function takeInsurance(){
  if(roundOver || currentBet === 0){
    setMessage("Insurance is only available during a round.")
    return
  }

  if(dealerHand[0].rank !== "A"){
    setMessage("Insurance only available when dealer shows Ace.")
    return
  }

  if(insuranceBet > 0){
    setMessage("Insurance already taken.")
    return
  }

  const amount = Math.floor(currentBet / 2)

  if(currentBet + sideBet + amount > bankroll){
    setMessage("Not enough bankroll for insurance.")
    return
  }

  insuranceBet = amount
  playSound("chip")
  setMessage("Insurance taken for $" + amount + ".")
  updateHud()
  setButtons(true)
}

function resolveInsurance(){
  if(insuranceBet === 0) return

  if(isBlackjack(dealerHand)){
    const payout = insuranceBet * 2
    bankroll += payout
    addFeed("Insurance paid $" + payout + ".")
  } else {
    bankroll -= insuranceBet
    addFeed("Insurance lost.")
  }

  insuranceBet = 0
}

function newRound(){
  if(bankroll <= 0){
    setMessage("You're out of money! Refresh to restart.")
    return
  }

  playerHand = []
  dealerHand = []

  bots.forEach(bot => {
    bot.hand = []
    bot.bet = 0
    bot.result = ""
  })

  currentBet = 0
  sideBet = 0
  insuranceBet = 0
  splitMode = false
  splitHands = []
  splitBets = []
  activeSplitHand = 0

  roundOver = true
  dealerHidden = true

  clearGlow()
  resetFeed()
  renderAll(false)
  setButtons(false)
  updateHud()

  newRoundBtn.style.display = "none"
  setMessage("Place your next bet.")
}
function saveGame(){
  localStorage.setItem("blackjackSave", JSON.stringify({
    bankroll,
    stats,
    tableLevel
  }))
}

function loadGame(){
  const save = localStorage.getItem("blackjackSave")
  if(!save) return

  let data

  try {
    data = JSON.parse(save)
  } catch {
    localStorage.removeItem("blackjackSave")
    return
  }

  bankroll = data.bankroll ?? 1000
  stats = data.stats ?? stats
  tableLevel = data.tableLevel ?? tableLevel
}

function resetSave(){
  localStorage.removeItem("blackjackSave")
  location.reload()
}
