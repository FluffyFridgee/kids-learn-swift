let score = 0;
let timeLeft = 30;
let combo = 0;
let gameInterval;
let moleInterval;
let isPlaying = false;
let greenAppleHits = {}; // 追蹤綠色蘋果的點擊次數

// 初始化遊戲
function initGame() {
    score = 0;
    timeLeft = 30;
    combo = 0;
    isPlaying = false;
    greenAppleHits = {};
    
    updateDisplay();
    clearIntervals();
    
    const holes = document.querySelectorAll('.mole-hole');
    holes.forEach(hole => {
        hole.classList.remove('active', 'hit');
        const mole = hole.querySelector('.mole');
        if (mole) {
            mole.classList.remove('green', 'hit-once');
            mole.removeAttribute('data-green');
        }
    });
}

// 開始遊戲
function startGame() {
    if (isPlaying) return;
    
    initGame();
    isPlaying = true;
    document.getElementById('startBtn').textContent = '遊戲進行中...';
    document.getElementById('startBtn').disabled = true;

    // 計時器
    gameInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // 蘋果出現（放慢頻率）
    moleInterval = setInterval(showRandomMole, 1200);
}

// 顯示隨機蘋果
function showRandomMole() {
    if (!isPlaying) return;

    const holes = document.querySelectorAll('.mole-hole');
    const randomIndex = Math.floor(Math.random() * holes.length);
    const hole = holes[randomIndex];

    if (hole.classList.contains('active')) return;

    hole.classList.add('active');
    
    // 30% 機率生成綠色蘋果
    const mole = hole.querySelector('.mole');
    const isGreen = Math.random() < 0.3;
    
    if (isGreen) {
        mole.classList.add('green');
        mole.setAttribute('data-green', 'true');
        greenAppleHits[randomIndex] = 0; // 初始化點擊次數
    } else {
        mole.classList.remove('green');
        mole.removeAttribute('data-green');
        delete greenAppleHits[randomIndex];
    }

    // 蘋果停留時間
    setTimeout(() => {
        if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
            hole.classList.remove('active');
            mole.classList.remove('green', 'hit-once');
            mole.removeAttribute('data-green');
            delete greenAppleHits[randomIndex];
            // 沒打到,連擊歸零
            combo = 0;
            updateDisplay();
        }
    }, 1000);
}

// 打蘋果
function whackMole(index) {
    if (!isPlaying) return;

    const hole = document.querySelector(`[data-index="${index}"]`);
    const mole = hole.querySelector('.mole');
    
    if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
        const isGreen = mole.getAttribute('data-green') === 'true';
        
        if (isGreen) {
            // 綠色蘋果需要點擊兩次
            if (!greenAppleHits[index]) {
                greenAppleHits[index] = 0;
            }
            greenAppleHits[index]++;
            
            if (greenAppleHits[index] === 1) {
                // 第一次點擊：顯示搖晃效果
                mole.classList.add('hit-once');
                return;
            } else if (greenAppleHits[index] >= 2) {
                // 第二次點擊：得分（20分）
                hole.classList.add('hit');
                combo++;
                const points = 20 + (combo - 1) * 2;
                score += points;
                delete greenAppleHits[index];
            }
        } else {
            // 紅色蘋果：一次就得分（10分）
            hole.classList.add('hit');
            combo++;
            const points = 10 + (combo - 1) * 2;
            score += points;
        }
        
        updateDisplay();

        setTimeout(() => {
            hole.classList.remove('active', 'hit');
            mole.classList.remove('green', 'hit-once');
            mole.removeAttribute('data-green');
        }, 300);
    }
}

// 更新顯示
function updateDisplay() {
    document.getElementById('timeLeft').textContent = timeLeft;
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = combo;
}

// 清除計時器
function clearIntervals() {
    if (gameInterval) clearInterval(gameInterval);
    if (moleInterval) clearInterval(moleInterval);
}

// 結束遊戲
async function endGame() {
    isPlaying = false;
    clearIntervals();
    
    const holes = document.querySelectorAll('.mole-hole');
    holes.forEach(hole => {
        hole.classList.remove('active', 'hit');
    });

    document.getElementById('startBtn').textContent = '重新開始';
    document.getElementById('startBtn').disabled = false;

    setTimeout(async () => {
        alert(`🎉 遊戲結束!你的分數: ${score}`);
        
        if (window.GameAPI && score > 0) {
            await window.GameAPI.submitScore('whack-a-mole', score);
        }
    }, 500);
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    initGame();

    document.getElementById('startBtn').addEventListener('click', startGame);

    const holes = document.querySelectorAll('.mole-hole');
    holes.forEach((hole, index) => {
        hole.addEventListener('click', () => whackMole(index));
    });
});
