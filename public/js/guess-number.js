let targetNumber;
let attemptsLeft;
let score;
let guessHistory = [];

// 初始化遊戲
function initGame() {
    targetNumber = Math.floor(Math.random() * 100) + 1;
    attemptsLeft = 10;
    score = 0;
    guessHistory = [];
    
    updateDisplay();
    document.getElementById('message').textContent = '';
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').disabled = false;
    document.getElementById('guessBtn').disabled = false;
    document.getElementById('restartBtn').style.display = 'none';
}

// 更新顯示
function updateDisplay() {
    document.getElementById('attemptsLeft').textContent = attemptsLeft;
    document.getElementById('score').textContent = score;
    
    const historyDiv = document.getElementById('history');
    if (guessHistory.length > 0) {
        historyDiv.innerHTML = '<h3>猜測歷史:</h3>' + 
            guessHistory.map(g => `<span class="history-item">${g}</span>`).join('');
    } else {
        historyDiv.innerHTML = '';
    }
}

// 處理猜測
function handleGuess() {
    const guessInput = document.getElementById('guessInput');
    const guess = parseInt(guessInput.value);
    const messageDiv = document.getElementById('message');

    if (isNaN(guess) || guess < 1 || guess > 100) {
        messageDiv.textContent = '請輸入 1 到 100 之間的數字!';
        messageDiv.className = 'message error';
        return;
    }

    guessHistory.push(guess);
    attemptsLeft--;

    if (guess === targetNumber) {
        // 猜中了!
        score = attemptsLeft * 10 + 10; // 剩餘次數越多,分數越高
        messageDiv.textContent = `🎉 恭喜!你猜對了!分數: ${score}`;
        messageDiv.className = 'message success';
        endGame(true);
    } else {
        // 沒猜中
        const hint = guess < targetNumber ? '太小了 ⬆️' : '太大了 ⬇️';
        messageDiv.textContent = hint;
        messageDiv.className = 'message hint';

        if (attemptsLeft === 0) {
            messageDiv.textContent = `😢 遊戲結束!正確答案是 ${targetNumber}`;
            messageDiv.className = 'message error';
            endGame(false);
        }
    }

    updateDisplay();
    guessInput.value = '';
    guessInput.focus();
}

// 結束遊戲
async function endGame(won) {
    document.getElementById('guessInput').disabled = true;
    document.getElementById('guessBtn').disabled = true;
    document.getElementById('restartBtn').style.display = 'block';

    if (won && window.GameAPI) {
        const success = await window.GameAPI.submitScore('guess-number', score);
        if (success) {
            setTimeout(() => {
                alert(`分數已提交!你的分數: ${score}`);
            }, 500);
        }
    }
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    initGame();

    document.getElementById('guessBtn').addEventListener('click', handleGuess);
    
    document.getElementById('guessInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGuess();
        }
    });

    document.getElementById('restartBtn').addEventListener('click', initGame);
});
