const suits = ["H", "D", "C", "S"]

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

let deck = []

function createDeck(){
  deck = []

  for(let s of suits){
    for(let r of ranks){
      deck.push({ suit: s, rank: r })
    }
  }
}

function shuffleDeck(){
  for(let i = deck.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
}

function drawCard(){
  if(deck.length < 10){
    createDeck()
    shuffleDeck()
  }

  return deck.pop()
}

function cardCode(card){
  let r = card.rank

  if(r === "10") r = "0"

  return r + card.suit
}

function cardValue(card){
  if(card.rank === "A") return 11
  if(["K", "Q", "J"].includes(card.rank)) return 10

  return parseInt(card.rank)
}

function handValue(hand){
  let total = 0
  let aces = 0

  hand.forEach(c => {
    total += cardValue(c)

    if(c.rank === "A"){
      aces++
    }
  })

  while(total > 21 && aces > 0){
    total -= 10
    aces--
  }

  return total
}

function isBlackjack(hand){
  return hand.length === 2 && handValue(hand) === 21
}