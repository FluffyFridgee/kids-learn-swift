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
function loadAllData() {
    loadStatistics();
    loadGameStats();
    loadUsers();
    loadGameLeaderboard(currentGameTab);
}

// 載入統計數據
function loadStatistics() {
    try {
        const allScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
        const users = JSON.parse(localStorage.getItem('gameUser') || 'null');
        
        // 統計獨特用戶
        const uniqueUsers = new Set(allScores.map(s => s.userId));
        document.getElementById('totalUsers').textContent = uniqueUsers.size || (users ? 1 : 0);
        
        // 總遊戲次數
        document.getElementById('totalGames').textContent = allScores.length;
        
        // 最高分
        const highestScore = allScores.length > 0 
            ? Math.max(...allScores.map(s => s.score))
            : 0;
        document.getElementById('highestScore').textContent = highestScore;
        
    } catch (error) {
        console.error('載入統計數據錯誤:', error);
    }
}

// 載入遊戲統計
function loadGameStats() {
    try {
        const allScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
        
        // 按遊戲名稱統計
        const gameStats = {};
        allScores.forEach(score => {
            if (!gameStats[score.gameName]) {
                gameStats[score.gameName] = {
                    game_name: score.gameName,
                    scores: [],
                    players: new Set()
                };
            }
            gameStats[score.gameName].scores.push(score.score);
            gameStats[score.gameName].players.add(score.userId);
        });
        
        // 轉換為統計格式
        const stats = Object.values(gameStats).map(game => ({
            game_name: game.game_name,
            unique_players: game.players.size,
            total_plays: game.scores.length,
            highest_score: game.scores.length > 0 ? Math.max(...game.scores) : 0,
            average_score: game.scores.length > 0 
                ? game.scores.reduce((a, b) => a + b, 0) / game.scores.length 
                : 0
        }));
        
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
function loadUsers() {
    try {
        const allScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
        
        // 按用戶統計
        const userStats = {};
        allScores.forEach(score => {
            if (!userStats[score.userId]) {
                userStats[score.userId] = {
                    id: score.userId,
                    username: score.username,
                    scores: [],
                    created_at: score.timestamp
                };
            }
            userStats[score.userId].scores.push(score.score);
            // 更新為最早的時間
            if (score.timestamp < userStats[score.userId].created_at) {
                userStats[score.userId].created_at = score.timestamp;
            }
        });
        
        // 轉換為用戶陣列
        allUsers = Object.values(userStats).map(user => ({
            id: user.id,
            username: user.username,
            total_score: user.scores.reduce((a, b) => a + b, 0),
            total_games: user.scores.length,
            average_score: user.scores.reduce((a, b) => a + b, 0) / user.scores.length,
            created_at: user.created_at
        }));
        
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
function loadGameLeaderboard(gameName) {
    const container = document.getElementById('gameLeaderboard');
    container.innerHTML = '<p class="loading">載入中...</p>';

    try {
        const allScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
        const gameScores = allScores.filter(s => s.gameName === gameName);
        
        // 按用戶聚合
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
        
        // 轉為陣列並排序，取前 20 名
        const data = Object.values(userStats)
            .sort((a, b) => b.best_score - a.best_score)
            .slice(0, 20);
        
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
