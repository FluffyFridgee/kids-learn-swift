const emojis = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍑', '🥝'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let score = 0;

// 初始化遊戲
function initGame() {
    cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    score = 1000; // 起始分數,每次翻牌扣10分
    
    renderCards();
    updateDisplay();
}

// 渲染卡片
function renderCards() {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';
    
    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.innerHTML = `<div class="card-content">${emoji}</div>`;
        card.addEventListener('click', () => flipCard(index));
        grid.appendChild(card);
    });
}

// 翻牌
function flipCard(index) {
    const cardElement = document.querySelector(`[data-index="${index}"]`);
    
    // 防止重複翻同一張牌或已配對的牌
    if (flippedCards.length >= 2 || 
        cardElement.classList.contains('flipped') || 
        cardElement.classList.contains('matched')) {
        return;
    }

    cardElement.classList.add('flipped');
    flippedCards.push(index);

    if (flippedCards.length === 2) {
        moves++;
        score = Math.max(0, score - 10); // 每次翻牌扣10分
        updateDisplay();
        checkMatch();
    }
}

// 檢查配對
function checkMatch() {
    const [index1, index2] = flippedCards;
    const card1 = document.querySelector(`[data-index="${index1}"]`);
    const card2 = document.querySelector(`[data-index="${index2}"]`);

    if (cards[index1] === cards[index2]) {
        // 配對成功
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            score += 50; // 配對成功加50分
            updateDisplay();
            flippedCards = [];

            if (matchedPairs === emojis.length) {
                endGame();
            }
        }, 500);
    } else {
        // 配對失敗
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    }
}

// 更新顯示
function updateDisplay() {
    document.getElementById('moves').textContent = moves;
    document.getElementById('matched').textContent = `${matchedPairs}/${emojis.length}`;
    document.getElementById('score').textContent = score;
}

// 結束遊戲
async function endGame() {
    setTimeout(async () => {
        alert(`🎉 恭喜完成!翻牌次數: ${moves}, 分數: ${score}`);
        
        if (window.GameAPI) {
            await window.GameAPI.submitScore('memory-cards', score);
        }
    }, 500);
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    document.getElementById('restartBtn').addEventListener('click', initGame);
});
