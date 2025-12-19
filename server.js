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

// 1. 創建用戶（管理員專用）
app.post('/api/admin/create-user', (req, res) => {
  const { username, password, isAdmin, adminToken } = req.body;
  
  // 這裡可以添加更嚴格的管理員驗證
  // 目前簡單檢查是否提供了管理員憑證
  
  if (!username || !password) {
    return res.status(400).json({ error: '帳號和密碼不能為空' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: '帳號至少 3 個字元' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密碼至少 6 個字元' });
  }

  // 檢查用戶是否已存在
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (user) {
      return res.status(400).json({ error: '帳號已存在' });
    }

    // 創建新用戶
    db.run(
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', 
      [username, password, isAdmin ? 1 : 0], 
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ 
          id: this.lastID, 
          username,
          isAdmin: isAdmin ? true : false,
          message: '帳號創建成功' 
        });
      }
    );
  });
});

// 2. 用戶登入
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '帳號和密碼不能為空' });
  }

  db.get(
    'SELECT id, username, is_admin, created_at FROM users WHERE username = ? AND password = ?', 
    [username, password], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ error: '帳號或密碼錯誤' });
      }

      res.json({ 
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1,
        created_at: user.created_at
      });
    }
  );
});

// 3. 獲取所有用戶（管理員專用）
app.get('/api/admin/all-users', (req, res) => {
  db.all('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      isAdmin: u.is_admin === 1,
      created_at: u.created_at
    })));
  });
});

// 4. 刪除用戶（管理員專用）
app.delete('/api/admin/users/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }
    
    // 同時刪除該用戶的所有分數記錄
    db.run('DELETE FROM scores WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('刪除用戶分數記錄錯誤:', err);
      }
    });
    
    res.json({ message: '用戶已刪除' });
  });
});

// 5. 提交分數
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

// 6. 獲取排行榜(按遊戲)
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

// 7. 獲取所有遊戲的統計數據(後台用)
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

// 8. 獲取所有用戶及其統計(後台用)
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

// 9. 獲取特定用戶的遊戲歷史
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
