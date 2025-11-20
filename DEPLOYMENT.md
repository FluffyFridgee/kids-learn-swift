# GitHub Pages 部署說明

## 部署步驟

### 方法一:直接部署前端到 GitHub Pages

1. **推送代碼到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用戶名/遊戲平台.git
   git push -u origin main
   ```

2. **啟用 GitHub Pages**
   - 進入 GitHub 倉庫的 Settings
   - 找到 Pages 選項
   - Source 選擇 `main` 分支的 `/public` 資料夾
   - 點擊 Save

3. **配置前端 API 路徑**
   
   由於 GitHub Pages 只支援靜態文件,後端需要部署到其他服務。
   修改 `public/js/main.js` 中的 API_BASE_URL:
   ```javascript
   const API_BASE_URL = 'https://你的後端服務.herokuapp.com/api';
   ```

### 方法二:使用 GitHub Actions 自動部署

創建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

## 後端部署選項

### 選項一:Heroku

1. 安裝 Heroku CLI
2. 創建 `Procfile`:
   ```
   web: node server.js
   ```
3. 部署:
   ```bash
   heroku create 你的應用名稱
   git push heroku main
   ```

### 選項二:Vercel

1. 安裝 Vercel CLI: `npm i -g vercel`
2. 創建 `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```
3. 部署: `vercel --prod`

### 選項三:Render

1. 連接 GitHub 倉庫
2. 選擇 Web Service
3. 設定:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

## 環境變量設置

在部署平台設置以下環境變量:

- `PORT`: 服務端口(通常自動設置)
- `NODE_ENV`: production

## 本地測試

```bash
# 安裝依賴
npm install

# 啟動服務器
npm start

# 開發模式(自動重啟)
npm run dev
```

訪問:
- 遊戲大廳: http://localhost:3000
- 後台管理: http://localhost:3000/admin.html

## 注意事項

1. **數據庫選擇**:
   - 本地開發使用 SQLite
   - 生產環境建議使用 PostgreSQL 或 MongoDB

2. **CORS 配置**:
   - 確保後端 CORS 設置允許前端域名訪問

3. **安全性**:
   - 後台管理建議添加身份驗證
   - API 建議添加速率限制

4. **性能優化**:
   - 啟用 gzip 壓縮
   - 使用 CDN 加速靜態資源
   - 實現緩存策略
