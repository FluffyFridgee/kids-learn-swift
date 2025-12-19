# 後端設置指南

## 本地運行後端

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動後端伺服器
```bash
npm start
```

伺服器將運行在 `http://localhost:3000`

### 3. 測試 API
打開瀏覽器訪問：
- 首頁: http://localhost:3000
- 後台: http://localhost:3000/admin.html

## 部署到 Vercel

### 1. 安裝 Vercel CLI (如果還沒有)
```bash
npm install -g vercel
```

### 2. 登入 Vercel
```bash
vercel login
```

### 3. 部署
```bash
vercel
```

按照提示完成部署。部署成功後會獲得一個網址，例如：
`https://your-project.vercel.app`

### 4. 更新前端 API 地址

部署成功後，需要更新前端代碼中的 API 地址：

1. 在 `js/main.js` 中更新：
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://your-project.vercel.app/api'; // 替換為你的 Vercel 網址
```

2. 在 `js/admin.js` 中也做同樣的更新

3. 同步更新 `public/js/main.js` 和 `public/js/admin.js`

## API 端點

### 用戶相關
- `POST /api/register` - 註冊新用戶
- `POST /api/login` - 用戶登入
- `GET /api/admin/all-users` - 獲取所有用戶（管理員）
- `DELETE /api/admin/users/:userId` - 刪除用戶（管理員）

### 遊戲相關
- `POST /api/scores` - 提交遊戲分數
- `GET /api/leaderboard/:gameName` - 獲取排行榜
- `GET /api/admin/stats` - 獲取遊戲統計
- `GET /api/admin/users` - 獲取用戶統計
- `GET /api/users/:userId/history` - 獲取用戶遊戲歷史

## 預設管理員帳號

- 帳號: `admin`
- 密碼: `admin123`

首次啟動後端時會自動創建此管理員帳號。

## 切換本地/後端模式

在 `js/main.js` 中修改：
```javascript
const USE_BACKEND = true; // true = 使用後端, false = 使用 localStorage
```

這樣可以在開發時輕鬆切換。
