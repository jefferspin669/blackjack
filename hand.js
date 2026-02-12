const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

let deck = [];

function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard() {
    return deck.pop();
}

function getCardValue(card) {
    if (card.rank === 'Ace') return 11;
    if (['King', 'Queen', 'Jack'].includes(card.rank)) return 10;
    return parseInt(card.rank);
}

function calculateHandValue(hand) {
    let total = 0;
    let aces = 0;

    for (let card of hand) {
        total += getCardValue(card);
        if (card.rank === 'Ace') aces++;
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
}
standBtn.onclick = async () => {
    hitBtn.disabled = true;
    standBtn.disabled = true;

    // Reveal dealer cards
    renderHand(dealerDiv, dealerHand);
    dealerScoreText.textContent = `Score: ${handValue(dealerHand)}`;

    // Dealer draws with delay
    while (handValue(dealerHand) < 17) {
        await sleep(500); // ⏱ 0.5s tension
        dealerHand.push(drawCard());
        renderHand(dealerDiv, dealerHand);
        dealerScoreText.textContent = `Score: ${handValue(dealerHand)}`;
    }

    const p = handValue(playerHand);
    const d = handValue(dealerHand);

    if (d > 21 || p > d) {
        bank += currentBet * 2;
        spawnChips();
        endGame("You win 🎉");
    } else if (d > p) {
        endGame("Dealer wins 😢");
    } else {
        bank += currentBet;
        endGame("Push 🤝");
    }

    bankText.textContent = `Bank: $${bank}`;
};
