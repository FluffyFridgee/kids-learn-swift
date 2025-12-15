let score = 0;
let lives = 3;
let combo = 0;
let moleInterval;
let isPlaying = false;
let greenAppleHits = {}; // 追蹤綠色蘋果的點擊次數

// 初始化遊戲
function initGame() {
    score = 0;
    lives = 3;
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

    // 物件出現（蘋果或蟲子）
    moleInterval = setInterval(showRandomMole, 1200);
}

// 顯示隨機物件（蘋果或蟲子）
function showRandomMole() {
    if (!isPlaying) return;

    const holes = document.querySelectorAll('.mole-hole');
    const randomIndex = Math.floor(Math.random() * holes.length);
    const hole = holes[randomIndex];

    if (hole.classList.contains('active')) return;

    hole.classList.add('active');
    
    const mole = hole.querySelector('.mole');
    const appleImg = mole.querySelector('.apple-img');
    const random = Math.random();
    
    // 20% 機率生成蟲子（30% 綠色蘋果，50% 紅色蘋果
    if (random < 0.2) {
        // 蟲子
        mole.classList.add('bug');
        mole.setAttribute('data-bug', 'true');
        mole.classList.remove('green');
        mole.removeAttribute('data-green');
        delete greenAppleHits[randomIndex];
    } else if (random < 0.5) {
        // 綠色蘋果
        mole.classList.add('green');
        mole.setAttribute('data-green', 'true');
        mole.classList.remove('bug');
        mole.removeAttribute('data-bug');
        greenAppleHits[randomIndex] = 0;
    } else {
        // 紅色蘋果
        mole.classList.remove('green', 'bug');
        mole.removeAttribute('data-green');
        mole.removeAttribute('data-bug');
        delete greenAppleHits[randomIndex];
    }

    // 物件停留時間
    setTimeout(() => {
        if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
            hole.classList.remove('active');
            // 等待物件完全消失後再移除類別
            setTimeout(() => {
                mole.classList.remove('green', 'bug', 'hit-once');
                mole.removeAttribute('data-green');
                mole.removeAttribute('data-bug');
                delete greenAppleHits[randomIndex];
            }, 400);
            // 沒打到,連擊歸零
            combo = 0;
            updateDisplay();
        }
    }, 1000);
}

// 打物件（蘋果或蟲子）
function whackMole(index) {
    if (!isPlaying) return;

    const hole = document.querySelector(`[data-index="${index}"]`);
    const mole = hole.querySelector('.mole');
    
    if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
        const isBug = mole.getAttribute('data-bug') === 'true';
        const isGreen = mole.getAttribute('data-green') === 'true';
        
        if (isBug) {
            // 點到蟲子：扣生命
            hole.classList.add('hit');
            lives--;
            combo = 0;
            updateDisplay();
            
            if (lives <= 0) {
                endGame();
            }
            
            setTimeout(() => {
                hole.classList.remove('active', 'hit');
                setTimeout(() => {
                    mole.classList.remove('bug');
                    mole.removeAttribute('data-bug');
                }, 400);
            }, 300);
        } else if (isGreen) {
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
            // 等待蘋果完全消失後再移除綠色
            setTimeout(() => {
                mole.classList.remove('green', 'hit-once');
                mole.removeAttribute('data-green');
            }, 400);
        }, 300);
    }
}

// 更新顯示
function updateDisplay() {
    const livesDisplay = '🍎'.repeat(lives);
    document.getElementById('lives').textContent = livesDisplay || '☠️';
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = combo;
}

// 清除計時器
function clearIntervals() {
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
