const botTemplates = [
  { name: "Vegas Vinnie", style: "risky", bankroll: 1000 },
  { name: "Card Shark Carla", style: "smart", bankroll: 1000 },
  { name: "Lucky Larry", style: "random", bankroll: 1000 },
  { name: "Silent Sam", style: "safe", bankroll: 1000 },
  { name: "Dealer Slayer", style: "aggressive", bankroll: 1000 }
]

let bots = []

function initBots(){
  const shuffled = [...botTemplates].sort(() => Math.random() - 0.5)

  bots = [
    { ...shuffled[0], hand: [], bet: 0, result: "" },
    { ...shuffled[1], hand: [], bet: 0, result: "" }
  ]

  document.getElementById("bot1-name").innerText = bots[0].name
  document.getElementById("bot2-name").innerText = bots[1].name
}

function botBet(bot){
  if(bot.bankroll <= 0) return 0

  if(bot.style === "risky") return Math.min(bot.bankroll, 100)
  if(bot.style === "aggressive") return Math.min(bot.bankroll, 150)
  if(bot.style === "safe") return Math.min(bot.bankroll, 25)
  if(bot.style === "random") return Math.min(bot.bankroll, [10, 25, 50, 100][Math.floor(Math.random() * 4)])

  return Math.min(bot.bankroll, 50)
}

function shouldBotHit(bot){
  const score = handValue(bot.hand)

  if(bot.style === "safe") return score < 17
  if(bot.style === "risky") return score < 15
  if(bot.style === "aggressive") return score < 18
  if(bot.style === "random") return score < 14 || (score < 19 && Math.random() < 0.25)

  return score < 16
}

function playBot(bot){
  while(shouldBotHit(bot)){
    bot.hand.push(drawCard())
  }
}

function botReaction(bot){
  const score = handValue(bot.hand)

  if(bot.bankroll <= 0) return `${bot.name}: I'm out.`
  if(score > 21) return `${bot.name}: Busted. Brutal.`
  if(score === 21) return `${bot.name}: That's money.`
  if(score >= 18) return `${bot.name}: I'm staying.`
  return `${bot.name}: Not my best hand.`
}
