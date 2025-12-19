const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 建立數據庫連接
const db = new sqlite3.Database(path.join(__dirname, 'games.db'), (err) => {
  if (err) {
    console.error('數據庫連接錯誤:', err.message);
  } else {
    console.log('已連接到 SQLite 數據庫');
    initDatabase();
  }
});

// 初始化數據庫表
function initDatabase() {
  // 用戶表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('創建 users 表錯誤:', err);
    } else {
      // 創建預設管理員帳號
      db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
        if (!user) {
          db.run('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', 
            ['admin', 'admin123', 1], 
            (err) => {
              if (err) {
                console.error('創建預設管理員錯誤:', err);
              } else {
                console.log('已創建預設管理員帳號: admin / admin123');
              }
            }
          );
        }
      });
    }
  });

  // 分數記錄表
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  console.log('數據庫表已初始化');
}

module.exports = db;
