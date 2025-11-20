# 遊戲平台專案

一個包含多個小遊戲和後台管理系統的網站專案。

## 功能特色

- 🎮 多個互動小遊戲
- 📊 即時排行榜
- 🎯 分數追蹤系統
- 💼 後台管理介面

## 遊戲列表

1. **猜數字遊戲** - 在限定次數內猜中隨機數字
2. **記憶卡遊戲** - 翻牌配對遊戲
3. **打地鼠遊戲** - 考驗反應速度

## 安裝與運行

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動伺服器
npm start

# 開發模式(自動重啟)
npm run dev
```

訪問 `http://localhost:3000` 查看遊戲平台
訪問 `http://localhost:3000/admin` 查看後台管理

### GitHub Pages 部署

本專案可以部署到 GitHub Pages。前端頁面為靜態文件,後端API需要部署到其他服務(如 Heroku, Vercel 等)。

## 專案結構

```
.
├── public/           # 靜態文件
│   ├── index.html   # 遊戲大廳
│   ├── admin.html   # 後台管理
│   ├── css/         # 樣式文件
│   ├── js/          # JavaScript文件
│   └── games/       # 各個遊戲頁面
├── server.js        # 後端伺服器
├── database.js      # 數據庫配置
└── package.json     # 專案配置
```

## 技術棧

- 前端: HTML5, CSS3, JavaScript (原生)
- 後端: Node.js + Express
- 數據庫: SQLite
- 部署: GitHub Pages + (後端服務)
