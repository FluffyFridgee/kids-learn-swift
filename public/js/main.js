// 用戶狀態管理
let currentUser = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    loadLeaderboard('memory-cards');
    setupEventListeners();
    setupShareUrl();
});

// 設置分享網址
function setupShareUrl() {
    const shareUrl = document.getElementById('shareUrl');
    const copyBtn = document.getElementById('copyBtn');
    
    if (shareUrl && copyBtn) {
        // 設置當前網址
        shareUrl.value = window.location.origin + window.location.pathname;
        
        // 複製功能
        copyBtn.addEventListener('click', () => {
            shareUrl.select();
            shareUrl.setSelectionRange(0, 99999); // 移動裝置
            
            navigator.clipboard.writeText(shareUrl.value).then(() => {
                copyBtn.textContent = '✅ 已複製！';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.textContent = '📋 複製';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                alert('複製失敗，請手動複製');
            });
        });
    }
}

// 設置事件監聽器
function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('usernameInput');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    // 標籤切換
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadLeaderboard(btn.dataset.game);
        });
    });
}

// 處理登入
function handleLogin() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();

    if (!username) {
        alert('請輸入您的名字');
        return;
    }

    // 創建用戶對象
    currentUser = {
        id: Date.now().toString(),
        username: username,
        created_at: new Date().toISOString()
    };
    
    saveUserToStorage(currentUser);
    updateUIAfterLogin();
}

// 更新登入後的UI
function updateUIAfterLogin() {
    const usernameInput = document.getElementById('usernameInput');
    const loginBtn = document.getElementById('loginBtn');
    const welcomeMsg = document.getElementById('welcomeMsg');
    const currentUserSpan = document.getElementById('currentUser');

    if (usernameInput) usernameInput.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'none';
    if (welcomeMsg) welcomeMsg.style.display = 'inline';
    if (currentUserSpan) currentUserSpan.textContent = currentUser.username;
}

// 從localStorage載入用戶
function loadUserFromStorage() {
    const storedUser = localStorage.getItem('gameUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUIAfterLogin();
    }
}

// 儲存用戶到localStorage
function saveUserToStorage(user) {
    localStorage.setItem('gameUser', JSON.stringify(user));
}

// 載入排行榜
function loadLeaderboard(gameName) {
    const leaderboardDiv = document.getElementById('leaderboard');
    
    // 從 localStorage 讀取所有分數
    const allScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
    
    // 篩選該遊戲的分數
    const gameScores = allScores.filter(s => s.gameName === gameName);
    
    // 按用戶聚合，取最高分和遊戲次數
    const userStats = {};
    gameScores.forEach(score => {
        if (!userStats[score.username]) {
            userStats[score.username] = {
                username: score.username,
                best_score: score.score,
                play_count: 1
            };
        } else {
            userStats[score.username].best_score = Math.max(
                userStats[score.username].best_score,
                score.score
            );
            userStats[score.username].play_count++;
        }
    });
    
    // 轉為陣列並排序
    const data = Object.values(userStats).sort((a, b) => b.best_score - a.best_score);
    
    displayLeaderboard(data);
}

// 顯示排行榜
function displayLeaderboard(data) {
    const leaderboardDiv = document.getElementById('leaderboard');

    if (data.length === 0) {
        leaderboardDiv.innerHTML = '<p class="loading">目前還沒有記錄</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>排名</th>
                    <th>玩家</th>
                    <th>最高分</th>
                    <th>遊戲次數</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach((row, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        html += `
            <tr>
                <td class="rank ${rankClass}">#${rank}</td>
                <td>${escapeHtml(row.username)}</td>
                <td>${row.best_score}</td>
                <td>${row.play_count}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    leaderboardDiv.innerHTML = html;
}

// 提交分數(供遊戲頁面使用)
function submitScore(gameName, score) {
    if (!currentUser) {
        alert('請先登入!');
        return false;
    }

    try {
        // 從 localStorage 讀取所有分數
        const allScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
        
        // 添加新分數
        allScores.push({
            userId: currentUser.id,
            username: currentUser.username,
            gameName: gameName,
            score: score,
            timestamp: new Date().toISOString()
        });
        
        // 儲存回 localStorage
        localStorage.setItem('gameScores', JSON.stringify(allScores));
        
        return true;
    } catch (error) {
        console.error('提交分數錯誤:', error);
        alert('分數提交失敗');
        return false;
    }
}

// HTML轉義(防止XSS)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 導出給遊戲頁面使用
if (typeof window !== 'undefined') {
    window.GameAPI = {
        getCurrentUser: () => currentUser,
        submitScore: submitScore,
        API_BASE_URL: API_BASE_URL
    };
}
