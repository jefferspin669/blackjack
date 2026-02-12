document.addEventListener("DOMContentLoaded", () => {
    let bank = 100;
    let currentBet = 0;

    const bankText = document.getElementById("bank");
    const betInput = document.getElementById("bet-input");
    const allInButton = document.getElementById("all-in-button");
    const startButton = document.getElementById("start-button");
    const menu = document.getElementById("menu");
    const game = document.getElementById("game");

    function updateBankUI() {
        bankText.textContent = `Bank: $${bank}`;
    }

    startButton.addEventListener("click", () => {
        const bet = parseInt(betInput.value);

        if (!bet || bet <= 0) {
            alert("Enter a valid bet!");
            return;
        }

        if (bet > bank) {
            alert("Not enough money!");
            return;
        }

        currentBet = bet;
        bank -= bet;
        updateBankUI();

        menu.style.display = "none";
        game.style.display = "block";

        startGame(); // from game.js
    });

    function winBet() {
        bank += currentBet * 2;
        currentBet = 0;
        updateBankUI();
    }

    function tieBet() {
        bank += currentBet;
        currentBet = 0;
        updateBankUI();
    }

    window.winBet = winBet;
    window.tieBet = tieBet;

    allInButton.addEventListener("click", () => {
        betInput.value = bank;
    });

    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const value = parseInt(chip.dataset.value);
            const current = parseInt(betInput.value) || 0;
            if (current + value <= bank) {
                betInput.value = current + value;
            }
        });
    });
});
function showDealerCards(hand, reveal = false) {
    dealerDiv.innerHTML = ""; // clear previous cards

    hand.forEach((card, index) => {
        const img = document.createElement("img");
        if (index === 0 || reveal) {
            img.src = card.image; // visible card
        } else {
            img.src = "https://deckofcardsapi.com/static/img/back.png"; // face-down
        }
        img.className = "card";
        img.width = 80;
        dealerDiv.appendChild(img);
    });
}
function getDealerVisibleScore(hand, reveal = false) {
    let visibleCards = reveal ? hand : [hand[0]]; // only first card if not revealed
    return calculateHandValue(visibleCards);
}
dealerScoreText.textContent = `Score: ${getDealerVisibleScore(currentDealerHand, false)}`; // shows only first card
standButton.addEventListener("click", () => {
    const hand = dealerHands[currentDealerIndex];

    // Reveal all cards
    showDealerCards(hand, true);

    // Dealer draws until 17+
    while(calculateHandValue(hand) < 17) {
        hand.push(drawCard());
        showDealerCards(hand, true);
    }

    // Update score correctly
    dealerScoreText.textContent = `Score: ${calculateHandValue(hand)}`;

    // Decide winner...
});
