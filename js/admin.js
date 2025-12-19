// API基礎URL
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://game-platform-kqct31fyu-fridges-projects-eaccd8b6.vercel.app/api';

let allUsers = [];
let currentGameTab = 'memory-cards';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupEventListeners();
});

// 設置事件監聽器
function setupEventListeners() {
    // 搜尋用戶
    const searchInput = document.getElementById('searchUser');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }

    // 排序選擇
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortUsers);
    }

    // 遊戲標籤切換
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGameTab = btn.dataset.game;
            loadGameLeaderboard(currentGameTab);
        });
    });
}

// 載入所有數據
async function loadAllData() {
    await Promise.all([
        loadStatistics(),
        loadGameStats(),
        loadUsers(),
        loadGameLeaderboard(currentGameTab)
    ]);
}

// 載入統計數據
async function loadStatistics() {
    try {
        const [usersResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/users`),
            fetch(`${API_BASE_URL}/admin/stats`)
        ]);

        const users = await usersResponse.json();
        const stats = await statsResponse.json();

        // 計算總用戶數
        document.getElementById('totalUsers').textContent = users.length;

        // 計算總遊戲次數
        const totalGames = stats.reduce((sum, game) => sum + game.total_plays, 0);
        document.getElementById('totalGames').textContent = totalGames;

        // 計算最高分
        const highestScore = stats.reduce((max, game) => 
            Math.max(max, game.highest_score || 0), 0);
        document.getElementById('highestScore').textContent = highestScore;

    } catch (error) {
        console.error('載入統計數據錯誤:', error);
    }
}

// 載入遊戲統計
async function loadGameStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`);
        const stats = await response.json();

        displayGameStats(stats);
    } catch (error) {
        console.error('載入遊戲統計錯誤:', error);
        document.getElementById('gameStats').innerHTML = 
            '<p class="loading">載入失敗</p>';
    }
}

// 顯示遊戲統計
function displayGameStats(stats) {
    const container = document.getElementById('gameStats');

    if (stats.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p class="empty-state-text">目前還沒有遊戲數據</p>
            </div>
        `;
        return;
    }

    const gameNames = {
        'memory-cards': '🃏 記憶卡',
        'whack-a-mole': '🔨 打地鼠'
    };

    let html = `
        <table>
            <thead>
                <tr>
                    <th>遊戲名稱</th>
                    <th>獨立玩家</th>
                    <th>總遊戲次數</th>
                    <th>最高分</th>
                    <th>平均分</th>
                    <th>熱門度</th>
                </tr>
            </thead>
            <tbody>
    `;

    const maxPlays = Math.max(...stats.map(s => s.total_plays));

    stats.forEach(game => {
        const popularity = (game.total_plays / maxPlays) * 100;
        html += `
            <tr>
                <td><strong>${gameNames[game.game_name] || game.game_name}</strong></td>
                <td>${game.unique_players}</td>
                <td>${game.total_plays}</td>
                <td><span class="badge badge-success">${game.highest_score}</span></td>
                <td>${Math.round(game.average_score)}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${popularity}%"></div>
                    </div>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// 載入用戶數據
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        allUsers = await response.json();
        displayUsers(allUsers);
    } catch (error) {
        console.error('載入用戶數據錯誤:', error);
        document.getElementById('userRanking').innerHTML = 
            '<p class="loading">載入失敗</p>';
    }
}

// 顯示用戶排行
function displayUsers(users) {
    const container = document.getElementById('userRanking');

    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p class="empty-state-text">目前還沒有用戶</p>
            </div>
        `;
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>排名</th>
                    <th>用戶名</th>
                    <th>總分</th>
                    <th>遊戲次數</th>
                    <th>平均分</th>
                    <th>註冊時間</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach((user, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
        const avgScore = user.total_games > 0 ? Math.round(user.total_score / user.total_games) : 0;
        const date = new Date(user.created_at).toLocaleDateString('zh-TW');

        html += `
            <tr>
                <td>
                    <span class="rank-indicator ${rankClass}">${rank}</span>
                </td>
                <td><strong>${escapeHtml(user.username)}</strong></td>
                <td><span class="badge badge-primary">${user.total_score || 0}</span></td>
                <td>${user.total_games || 0}</td>
                <td>${avgScore}</td>
                <td>${date}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// 篩選用戶
function filterUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm)
    );
    displayUsers(filtered);
}

// 排序用戶
function sortUsers() {
    const sortBy = document.getElementById('sortBy').value;
    const sorted = [...allUsers];

    switch(sortBy) {
        case 'score':
            sorted.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
            break;
        case 'games':
            sorted.sort((a, b) => (b.total_games || 0) - (a.total_games || 0));
            break;
        case 'date':
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }

    allUsers = sorted;
    displayUsers(sorted);
}

// 載入遊戲排行榜
async function loadGameLeaderboard(gameName) {
    const container = document.getElementById('gameLeaderboard');
    container.innerHTML = '<p class="loading">載入中...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard/${gameName}?limit=20`);
        const data = await response.json();
        displayGameLeaderboard(data);
    } catch (error) {
        console.error('載入遊戲排行榜錯誤:', error);
        container.innerHTML = '<p class="loading">載入失敗</p>';
    }
}

// 顯示遊戲排行榜
function displayGameLeaderboard(data) {
    const container = document.getElementById('gameLeaderboard');

    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <p class="empty-state-text">這個遊戲還沒有記錄</p>
            </div>
        `;
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
                    <th>最後遊玩</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach((row, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
        const lastPlayed = new Date(row.last_played).toLocaleDateString('zh-TW');

        html += `
            <tr>
                <td>
                    <span class="rank-indicator ${rankClass}">${rank}</span>
                </td>
                <td><strong>${escapeHtml(row.username)}</strong></td>
                <td><span class="badge badge-success">${row.best_score}</span></td>
                <td>${row.play_count}</td>
                <td>${lastPlayed}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// HTML轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 定時刷新數據(每30秒)
setInterval(() => {
    loadAllData();
}, 30000);
