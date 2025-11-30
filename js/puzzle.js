let uploadedImage = null;
let puzzlePieces = [];
let emptyIndex = 29; // 右下角為空格 (5x6 = 30格，索引29)
let moves = 0;
let startTime = null;
let timerInterval = null;
let score = 0;

const ROWS = 6;
const COLS = 5;
const TOTAL_PIECES = ROWS * COLS;

// 示範圖片 URLs (使用 placeholder 服務)
const DEMO_IMAGES = {
    1: 'https://picsum.photos/500/600?random=1',
    2: 'https://picsum.photos/500/600?random=2',
    3: 'https://picsum.photos/500/600?random=3'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    const uploadBtn = document.getElementById('uploadBtn');
    const imageInput = document.getElementById('imageInput');
    const confirmBtn = document.getElementById('confirmBtn');
    const changeBtn = document.getElementById('changeBtn');
    const restartBtn = document.getElementById('restartBtn');
    const showPreviewBtn = document.getElementById('showPreviewBtn');

    uploadBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    confirmBtn.addEventListener('click', startPuzzle);
    changeBtn.addEventListener('click', resetToUpload);
    restartBtn.addEventListener('click', restartPuzzle);
    showPreviewBtn.addEventListener('click', toggleOriginalPreview);

    // 示範圖片按鈕
    document.querySelectorAll('.demo-img-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const demoNum = btn.dataset.demo;
            loadDemoImage(demoNum);
        });
    });
}

// 處理圖片上傳
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案！');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        showPreview(uploadedImage);
    };
    reader.readAsDataURL(file);
}

// 載入示範圖片
function loadDemoImage(demoNum) {
    uploadedImage = DEMO_IMAGES[demoNum];
    showPreview(uploadedImage);
}

// 顯示預覽
function showPreview(imageSrc) {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('previewImage').src = imageSrc;
}

// 重置到上傳頁面
function resetToUpload() {
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'block';
    uploadedImage = null;
}

// 開始拼圖遊戲
function startPuzzle() {
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('puzzleSection').style.display = 'block';
    document.getElementById('originalImage').src = uploadedImage;

    initializePuzzle();
    startTimer();
}

// 初始化拼圖
function initializePuzzle() {
    moves = 0;
    emptyIndex = TOTAL_PIECES - 1;
    updateDisplay();

    // 創建拼圖片段索引
    puzzlePieces = Array.from({ length: TOTAL_PIECES }, (_, i) => i);
    
    // 打亂拼圖（確保可解）
    shufflePuzzle();
    
    // 渲染拼圖
    renderPuzzle();
}

// 打亂拼圖（使用可解的隨機移動）
function shufflePuzzle() {
    const shuffleMoves = 200;
    for (let i = 0; i < shuffleMoves; i++) {
        const neighbors = getValidNeighbors(emptyIndex);
        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        swapPieces(emptyIndex, randomNeighbor);
        emptyIndex = randomNeighbor;
    }
}

// 獲取空格的有效鄰居
function getValidNeighbors(index) {
    const neighbors = [];
    const row = Math.floor(index / COLS);
    const col = index % COLS;

    // 上
    if (row > 0) neighbors.push(index - COLS);
    // 下
    if (row < ROWS - 1) neighbors.push(index + COLS);
    // 左
    if (col > 0) neighbors.push(index - 1);
    // 右
    if (col < COLS - 1) neighbors.push(index + 1);

    return neighbors;
}

// 交換拼圖片段
function swapPieces(index1, index2) {
    [puzzlePieces[index1], puzzlePieces[index2]] = [puzzlePieces[index2], puzzlePieces[index1]];
}

// 渲染拼圖
function renderPuzzle() {
    const grid = document.getElementById('puzzleGrid');
    grid.innerHTML = '';

    puzzlePieces.forEach((pieceValue, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.dataset.index = index;

        if (pieceValue === TOTAL_PIECES - 1) {
            // 空格
            piece.classList.add('empty');
        } else {
            // 設置背景圖片位置
            const row = Math.floor(pieceValue / COLS);
            const col = pieceValue % COLS;
            piece.style.backgroundImage = `url(${uploadedImage})`;
            piece.style.backgroundPosition = `${col * 25}% ${row * 20}%`;
            
            // 檢查是否在正確位置
            if (pieceValue === index) {
                piece.classList.add('correct');
            }

            piece.addEventListener('click', () => handlePieceClick(index));
        }

        grid.appendChild(piece);
    });
}

// 處理拼圖點擊
function handlePieceClick(clickedIndex) {
    const neighbors = getValidNeighbors(emptyIndex);
    
    if (neighbors.includes(clickedIndex)) {
        swapPieces(emptyIndex, clickedIndex);
        emptyIndex = clickedIndex;
        moves++;
        updateDisplay();
        renderPuzzle();

        // 檢查是否完成
        if (checkCompletion()) {
            completePuzzle();
        }
    }
}

// 檢查是否完成
function checkCompletion() {
    return puzzlePieces.every((piece, index) => piece === index);
}

// 完成拼圖
async function completePuzzle() {
    stopTimer();
    
    // 計算分數（基於移動次數和時間）
    const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const baseScore = 1000;
    const movesPenalty = moves * 2;
    const timePenalty = timeSeconds;
    score = Math.max(100, baseScore - movesPenalty - timePenalty);

    updateDisplay();

    // 提交分數
    if (window.GameAPI) {
        await window.GameAPI.submitScore('puzzle', score);
    }

    // 顯示完成訊息
    setTimeout(() => {
        showCompletionMessage();
    }, 500);
}

// 顯示完成訊息
function showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'completion-message';
    message.innerHTML = `
        <h2>🎉 恭喜完成！</h2>
        <p>移動次數: ${moves}</p>
        <p>使用時間: ${document.getElementById('time').textContent}</p>
        <div class="score-display">${score}</div>
        <p>分數</p>
        <button class="confirm-btn" onclick="location.reload()">再玩一次</button>
        <button class="change-btn" onclick="location.href='../index.html'">返回大廳</button>
    `;
    document.body.appendChild(message);
}

// 重新開始
function restartPuzzle() {
    stopTimer();
    initializePuzzle();
    startTimer();
}

// 切換顯示原圖
function toggleOriginalPreview() {
    const preview = document.getElementById('originalPreview');
    const btn = document.getElementById('showPreviewBtn');
    
    if (preview.style.display === 'none') {
        preview.style.display = 'block';
        btn.textContent = '✕ 關閉原圖';
    } else {
        preview.style.display = 'none';
        btn.textContent = '👁️ 顯示原圖';
    }
}

// 點擊原圖預覽外部關閉
document.addEventListener('click', (e) => {
    const preview = document.getElementById('originalPreview');
    const btn = document.getElementById('showPreviewBtn');
    
    if (preview && preview.style.display === 'block' && 
        !preview.contains(e.target) && e.target !== btn) {
        preview.style.display = 'none';
        btn.textContent = '👁️ 顯示原圖';
    }
});

// 計時器
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    if (!startTime) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('time').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 更新顯示
function updateDisplay() {
    document.getElementById('moves').textContent = moves;
    document.getElementById('score').textContent = score;
}
