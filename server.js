const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API路由

// 1. 獲取或創建用戶
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '用戶名不能為空' });
  }

  // 先檢查用戶是否存在
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (user) {
      return res.json(user);
    }

    // 創建新用戶
    db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, username });
    });
  });
});

// 2. 提交分數
app.post('/api/scores', (req, res) => {
  const { userId, gameName, score } = req.body;

  if (!userId || !gameName || score === undefined) {
    return res.status(400).json({ error: '缺少必要參數' });
  }

  db.run(
    'INSERT INTO scores (user_id, game_name, score) VALUES (?, ?, ?)',
    [userId, gameName, score],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        id: this.lastID, 
        message: '分數已記錄',
        scoreId: this.lastID 
      });
    }
  );
});

// 3. 獲取排行榜(按遊戲)
app.get('/api/leaderboard/:gameName', (req, res) => {
  const { gameName } = req.params;
  const limit = req.query.limit || 10;

  const query = `
    SELECT 
      users.username,
      MAX(scores.score) as best_score,
      COUNT(scores.id) as play_count,
      MAX(scores.created_at) as last_played
    FROM scores
    JOIN users ON scores.user_id = users.id
    WHERE scores.game_name = ?
    GROUP BY users.id, users.username
    ORDER BY best_score DESC
    LIMIT ?
  `;

  db.all(query, [gameName, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 4. 獲取所有遊戲的統計數據(後台用)
app.get('/api/admin/stats', (req, res) => {
  const query = `
    SELECT 
      game_name,
      COUNT(DISTINCT user_id) as unique_players,
      COUNT(*) as total_plays,
      MAX(score) as highest_score,
      AVG(score) as average_score
    FROM scores
    GROUP BY game_name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 5. 獲取所有用戶及其統計(後台用)
app.get('/api/admin/users', (req, res) => {
  const query = `
    SELECT 
      users.id,
      users.username,
      users.created_at,
      COUNT(scores.id) as total_games,
      SUM(scores.score) as total_score
    FROM users
    LEFT JOIN scores ON users.id = scores.user_id
    GROUP BY users.id, users.username, users.created_at
    ORDER BY total_score DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 6. 獲取特定用戶的遊戲歷史
app.get('/api/users/:userId/history', (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      scores.game_name,
      scores.score,
      scores.created_at
    FROM scores
    WHERE scores.user_id = ?
    ORDER BY scores.created_at DESC
    LIMIT 50
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
  console.log(`遊戲大廳: http://localhost:${PORT}`);
  console.log(`後台管理: http://localhost:${PORT}/admin.html`);
});
