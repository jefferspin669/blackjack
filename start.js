document.addEventListener("DOMContentLoaded", () => {

    const startButton = document.getElementById("start-button");
    const hitButton = document.getElementById("hit-button");
    const standButton = document.getElementById("stand-button");
    const restartButton = document.getElementById("restart-button");

    const playerScoreText = document.getElementById("player-score");
    const dealerScoreText = document.getElementById("dealer-score");
    const statusText = document.getElementById("status");

    const menu = document.getElementById("menu");
    const game = document.getElementById("game");

    let playerHand = [];
    let dealerHand = [];

    window.startGame = function () {
        playerHand = [];
        dealerHand = [];

        createDeck();
        shuffleDeck();

        playerHand.push(drawCard(), drawCard());
        dealerHand.push(drawCard(), drawCard());

        hitButton.disabled = false;
        standButton.disabled = false;
        restartButton.style.display = "none";
        statusText.textContent = "";

        updateUI();
    };

    hitButton.addEventListener("click", () => {
        playerHand.push(drawCard());
        updateUI();

        if (calculateHandValue(playerHand) > 21) {
            endGame("Player busts! Dealer wins 😢");
        }
    });

   standButton.addEventListener("click", async () => {
    // Reveal dealer cards
    showCards(dealerDiv, dealerCards);
    updateScores(); // Update dealer score immediately

    // Dealer hits until 17+
    while(getScore(dealerCards) < 17) {
        const newCard = await drawCards(1);
        dealerCards.push(newCard[0]);
        showCards(dealerDiv, dealerCards);
        updateScores(); // Update score after each draw
        await new Promise(r => setTimeout(r, 500)); // optional delay to see cards appear
    }

    decideWinner();
});

        decideWinner();
    });

    restartButton.addEventListener("click", () => {
        game.style.display = "none";
        menu.style.display = "block";
    });

    function decideWinner() {
        const playerTotal = calculateHandValue(playerHand);
        const dealerTotal = calculateHandValue(dealerHand);

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
            winBet();
            endGame("Player wins 🎉");
        } else if (dealerTotal > playerTotal) {
            endGame("Dealer wins 😢");
        } else {
            tieBet();
            endGame("It's a tie 🤝");
        }
    }

    function endGame(message) {
        statusText.textContent = message;
        hitButton.disabled = true;
        standButton.disabled = true;
        restartButton.style.display = "inline-block";
        updateUI();
    }

    function updateUI() {
        const playerDiv = document.getElementById("player-cards");
        const dealerDiv = document.getElementById("dealer-cards");
        const deckDiv = document.getElementById("deck");

        playerDiv.innerHTML = "";
        dealerDiv.innerHTML = "";

        playerHand.forEach(card => {
            playerDiv.appendChild(createCardImg(card));
        });

        dealerHand.forEach(card => {
            dealerDiv.appendChild(createCardImg(card));
        });

        playerScoreText.textContent = `Score: ${calculateHandValue(playerHand)}`;
        dealerScoreText.textContent = `Score: ${calculateHandValue(dealerHand)}`;
        deckDiv.textContent = `Deck: ${deck.length} cards`;
    }

    function createCardImg(card) {
        const img = document.createElement("img");
        img.src = `https://deckofcardsapi.com/static/img/${getCardCode(card)}.png`;
        img.className = "card";
        img.width = 80;
        return img;
    }

let deckId;

async function initDeck() {
    const res = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
    const data = await res.json();
    deckId = data.deck_id;
}
async function drawCards(count) {
    const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    const data = await res.json();
    return data.cards; // array of card objects with image URLs
}
function showCards(container, cards) {
    container.innerHTML = "";
    cards.forEach(card => {
        const img = document.createElement('img');
        img.src = card.image;
        img.className = "card";
        img.width = 80;
        container.appendChild(img);
    });
}
hitButton.addEventListener("click", async () => {
    const newCard = await drawCards(1);
    playerCards.push(newCard[0]);
    showCards(playerDiv, playerCards);
    updateScores();

    if (getScore(playerCards) > 21) endGame("Player busts! Dealer wins 😢");
});
function getScore(cards) {
    let total = 0;
    let aces = 0;
    cards.forEach(card => {
        if (card.value === "ACE") { total += 11; aces++; }
        else if (["KING","QUEEN","JACK"].includes(card.value)) total += 10;
        else total += parseInt(card.value);
    });
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function updateScores() {
    playerScoreText.textContent = `Score: ${getScore(playerCards)}`;
    dealerScoreText.textContent = `Score: ${getScore(dealerCards)}`;
}
function spawnWinningChips(amount = 5) {
    const container = document.getElementById("chip-container");

    for (let i = 0; i < amount; i++) {
        const chip = document.createElement("div");
        chip.className = "falling-chip";

        // Random horizontal start
        chip.style.left = `${Math.random() * 80 + 10}%`;

        // Optional random size
        chip.style.width = `${30 + Math.random() * 20}px`;
        chip.style.height = chip.style.width;

        container.appendChild(chip);

        // Remove chip after animation
        chip.addEventListener("animationend", () => {
            chip.remove();
        });
    }
}
if(dealerTotal > 21 || playerTotal > dealerTotal) {
    winBet();
    spawnWinningChips(5); // spawn 5 chips
    endGame(`Player wins against dealer ${currentDealerIndex + 1} 🎉`);
}
chip.style.backgroundImage = "url('https://example.com/chip.png')";
chip.style.backgroundSize = "cover";
function spawnWinningChips(amount = 10) {
    const container = document.getElementById("chip-container");

    const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"]; // multiple colors

    for (let i = 0; i < amount; i++) {
        const chip = document.createElement("div");
        chip.className = "falling-chip";

        // Random horizontal start
        chip.style.left = `${Math.random() * 80 + 10}%`;

        // Random size
        const size = 30 + Math.random() * 20;
        chip.style.width = `${size}px`;
        chip.style.height = `${size}px`;

        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        chip.style.background = `radial-gradient(circle, ${color}, dark${color})`;

        // Random spin speed
        const spinDuration = 0.5 + Math.random() * 1; // 0.5s to 1.5s
        chip.style.animation = `fall 1s ease-out forwards, spin ${spinDuration}s linear forwards`;

        container.appendChild(chip);

        // Remove chip after animation
        chip.addEventListener("animationend", () => {
            chip.remove();
        });
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
