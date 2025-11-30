let uploadedImage = null;
let puzzleSlots = []; // 拼圖框架的格子狀態
let availablePieces = []; // 可用的拼圖碎片
let moves = 0;
let startTime = null;
let timerInterval = null;
let score = 0;

const ROWS = 6;
const COLS = 5;
const TOTAL_PIECES = ROWS * COLS;

// 示範圖片 URLs
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
    score = 0;
    updateDisplay();

    // 初始化拼圖格子（都是空的）
    puzzleSlots = Array(TOTAL_PIECES).fill(null);

    // 創建所有碎片（打亂順序）
    availablePieces = Array.from({ length: TOTAL_PIECES }, (_, i) => i);
    shuffleArray(availablePieces);

    // 渲染拼圖框架和碎片
    renderPuzzleFrame();
    renderPuzzlePieces();
}

// 打亂陣列
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 渲染拼圖框架
function renderPuzzleFrame() {
    const grid = document.getElementById('puzzleGrid');
    grid.innerHTML = '';

    for (let i = 0; i < TOTAL_PIECES; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.slotIndex = i;

        // 設置拖放事件
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('dragleave', handleDragLeave);

        grid.appendChild(slot);
    }
}

// 渲染碎片區域
function renderPuzzlePieces() {
    const container = document.getElementById('piecesContainer');
    container.innerHTML = '';

    availablePieces.forEach((pieceValue, index) => {
        if (pieceValue === null) return; // 已被放置的碎片

        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.draggable = true;
        piece.dataset.pieceValue = pieceValue;
        piece.dataset.arrayIndex = index;

        // 設置背景圖片位置
        const row = Math.floor(pieceValue / COLS);
        const col = pieceValue % COLS;
        piece.style.backgroundImage = `url(${uploadedImage})`;
        piece.style.backgroundPosition = `${col * 25}% ${row * 20}%`;

        // 拖放事件
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);

        container.appendChild(piece);
    });
}

// 拖動開始
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.pieceValue);
    e.dataTransfer.setData('arrayIndex', e.target.dataset.arrayIndex);
}

// 處理已放置碎片的拖動開始（從框架移除）
function handlePlacedPieceDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    const slotIndex = parseInt(e.target.dataset.slotIndex);
    const pieceValue = parseInt(e.target.dataset.pieceValue);
    
    e.dataTransfer.setData('text/plain', pieceValue);
    e.dataTransfer.setData('fromSlot', slotIndex);
}

// 拖動結束
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 拖動經過
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const slot = e.currentTarget;
    if (!slot.classList.contains('filled')) {
        slot.classList.add('drag-over');
    }
}

// 離開拖動區域
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

// 放下碎片
function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');

    const slotIndex = parseInt(slot.dataset.slotIndex);
    
    // 檢查這個格子是否已經有碎片
    if (puzzleSlots[slotIndex] !== null) {
        return;
    }

    const pieceValue = parseInt(e.dataTransfer.getData('text/plain'));
    const arrayIndex = e.dataTransfer.getData('arrayIndex');
    const fromSlot = e.dataTransfer.getData('fromSlot');

    // 如果是從碎片區拖來的
    if (arrayIndex !== '') {
        placePiece(slotIndex, pieceValue, parseInt(arrayIndex));
    }
    // 如果是從其他格子拖來的
    else if (fromSlot !== '') {
        const fromSlotIndex = parseInt(fromSlot);
        
        // 先移除原位置的碎片
        const fromSlotElement = document.querySelectorAll('.puzzle-slot')[fromSlotIndex];
        fromSlotElement.innerHTML = '';
        fromSlotElement.classList.remove('filled');
        puzzleSlots[fromSlotIndex] = null;
        
        // 放置到新位置
        puzzleSlots[slotIndex] = pieceValue;
        moves++;
        updateDisplay();
        renderPuzzleSlot(slotIndex, pieceValue);
        
        if (checkCompletion()) {
            completePuzzle();
        }
    }
}

// 從格子移除碎片
function removePieceFromSlot(slotIndex) {
    const pieceValue = puzzleSlots[slotIndex];
    if (pieceValue === null) return;
    
    // 更新狀態
    puzzleSlots[slotIndex] = null;
    availablePieces.push(pieceValue);
    
    // 清空格子
    const slot = document.querySelectorAll('.puzzle-slot')[slotIndex];
    slot.innerHTML = '';
    slot.classList.remove('filled');
    
    // 重新渲染碎片區域
    renderPuzzlePieces();
}

// 渲染單個格子
function renderPuzzleSlot(slotIndex, pieceValue) {
    const slot = document.querySelectorAll('.puzzle-slot')[slotIndex];
    slot.innerHTML = '';
    
    if (pieceValue === slotIndex) {
        slot.classList.add('filled');
    } else {
        slot.classList.remove('filled');
    }
    
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece placed';
    piece.draggable = true;
    piece.dataset.pieceValue = pieceValue;
    piece.dataset.slotIndex = slotIndex;
    
    const row = Math.floor(pieceValue / COLS);
    const col = pieceValue % COLS;
    piece.style.backgroundImage = `url(${uploadedImage})`;
    piece.style.backgroundPosition = `${col * 25}% ${row * 20}%`;

    if (pieceValue === slotIndex) {
        piece.classList.add('correct');
    }

    piece.addEventListener('dragstart', handlePlacedPieceDragStart);
    piece.addEventListener('dragend', handleDragEnd);
    piece.addEventListener('click', () => removePieceFromSlot(slotIndex));

    slot.appendChild(piece);
}

// 放置碎片
function placePiece(slotIndex, pieceValue, arrayIndex) {
    // 更新狀態
    puzzleSlots[slotIndex] = pieceValue;
    availablePieces[arrayIndex] = null;
    moves++;
    updateDisplay();

    // 在格子中渲染碎片
    const slot = document.querySelectorAll('.puzzle-slot')[slotIndex];
    
    // 只有正確位置才標記為 filled
    if (pieceValue === slotIndex) {
        slot.classList.add('filled');
    }
    
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece placed';
    piece.draggable = true;
    piece.dataset.pieceValue = pieceValue;
    piece.dataset.slotIndex = slotIndex;
    
    const row = Math.floor(pieceValue / COLS);
    const col = pieceValue % COLS;
    piece.style.backgroundImage = `url(${uploadedImage})`;
    piece.style.backgroundPosition = `${col * 25}% ${row * 20}%`;

    // 檢查是否放對位置
    if (pieceValue === slotIndex) {
        piece.classList.add('correct');
    }

    // 添加拖動事件，讓碎片可以被移回碎片區
    piece.addEventListener('dragstart', handlePlacedPieceDragStart);
    piece.addEventListener('dragend', handleDragEnd);
    
    // 添加點擊移除功能
    piece.addEventListener('click', () => removePieceFromSlot(slotIndex));

    slot.appendChild(piece);

    // 重新渲染碎片區域
    renderPuzzlePieces();

    // 檢查是否完成
    if (checkCompletion()) {
        completePuzzle();
    }
}

// 檢查是否完成
function checkCompletion() {
    // 檢查是否所有格子都填滿且都在正確位置
    return puzzleSlots.every((piece, index) => piece === index);
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
