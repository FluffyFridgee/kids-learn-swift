let score = 0;
let timeLeft = 30;
let combo = 0;
let gameInterval;
let moleInterval;
let isPlaying = false;

// 初始化遊戲
function initGame() {
    score = 0;
    timeLeft = 30;
    combo = 0;
    isPlaying = false;
    
    updateDisplay();
    clearIntervals();
    
    const holes = document.querySelectorAll('.mole-hole');
    holes.forEach(hole => {
        hole.classList.remove('active', 'hit');
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

    // 地鼠出現
    moleInterval = setInterval(showRandomMole, 800);
}

// 顯示隨機地鼠
function showRandomMole() {
    if (!isPlaying) return;

    const holes = document.querySelectorAll('.mole-hole');
    const randomIndex = Math.floor(Math.random() * holes.length);
    const hole = holes[randomIndex];

    if (hole.classList.contains('active')) return;

    hole.classList.add('active');

    // 地鼠停留時間
    setTimeout(() => {
        if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
            hole.classList.remove('active');
            // 沒打到,連擊歸零
            combo = 0;
            updateDisplay();
        }
    }, 600);
}

// 打地鼠
function whackMole(index) {
    if (!isPlaying) return;

    const hole = document.querySelector(`[data-index="${index}"]`);
    
    if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
        hole.classList.add('hit');
        combo++;
        
        // 分數計算:基礎10分 + 連擊加成
        const points = 10 + (combo - 1) * 2;
        score += points;
        
        updateDisplay();

        setTimeout(() => {
            hole.classList.remove('active', 'hit');
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
