// API基礎URL - 根據環境自動調整
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://game-platform-kqct31fyu-fridges-projects-eaccd8b6.vercel.app/api';

// 用戶狀態管理
let currentUser = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    loadLeaderboard('guess-number');
    setupEventListeners();
});

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
async function handleLogin() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();

    if (!username) {
        alert('請輸入您的名字');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            throw new Error('登入失敗');
        }

        const user = await response.json();
        currentUser = user;
        saveUserToStorage(user);
        updateUIAfterLogin();
    } catch (error) {
        console.error('登入錯誤:', error);
        alert('登入失敗,請稍後再試');
    }
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
async function loadLeaderboard(gameName) {
    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '<p class="loading">載入中...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard/${gameName}`);
        if (!response.ok) {
            throw new Error('無法載入排行榜');
        }

        const data = await response.json();
        displayLeaderboard(data);
    } catch (error) {
        console.error('載入排行榜錯誤:', error);
        leaderboardDiv.innerHTML = '<p class="loading">載入失敗</p>';
    }
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
async function submitScore(gameName, score) {
    if (!currentUser) {
        alert('請先登入!');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                gameName: gameName,
                score: score
            })
        });

        if (!response.ok) {
            throw new Error('提交分數失敗');
        }

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
