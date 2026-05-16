// DOM Елементи
const boardEl = document.getElementById('game-board');
const timerEl = document.getElementById('timer');
const flagsEl = document.getElementById('flags-count');
const startBtn = document.getElementById('start-btn');

// Стан гри
const gameState = {
    rows: 10, cols: 10, minesCount: 15,
    status: 'process', // 'process', 'win', 'lose'
    gameTime: 0, timerId: null, flagsPlaced: 0, isFirstClick: true
};
let field = [];

// Ініціалізація гри
function initGame() {
    // Скидання стану
    clearInterval(gameState.timerId);
    gameState.status = 'process';
    gameState.gameTime = 0;
    gameState.flagsPlaced = 0;
    gameState.isFirstClick = true;
    startBtn.textContent = '🙂';
    updateUI();

    // Створення порожнього поля
    field = [];
    for (let r = 0; r < gameState.rows; r++) {
        const row = [];
        for (let c = 0; c < gameState.cols; c++) {
            row.push({ type: 'empty', state: 'closed', neighborMines: 0 });
        }
        field.push(row);
    }
    renderBoard();
}

// Генерація мін (після 1-го кліку)
function placeMines(firstR, firstC) {
    let placed = 0;
    while (placed < gameState.minesCount) {
        const r = Math.floor(Math.random() * gameState.rows);
        const c = Math.floor(Math.random() * gameState.cols);
        // Не ставимо міну туди, куди клікнув гравець, і не дублюємо
        if ((r !== firstR || c !== firstC) && field[r][c].type !== 'mine') {
            field[r][c].type = 'mine';
            placed++;
        }
    }

    // Підрахунок сусідів
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (field[r][c].type === 'mine') continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                        if (field[nr][nc].type === 'mine') count++;
                    }
                }
            }
            field[r][c].neighborMines = count;
        }
    }
}

// Рендеринг DOM
function renderBoard() {
    boardEl.innerHTML = ''; // Очищаємо поле
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellData = field[r][c];
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');

            // Візуалізація станів
            if (cellData.state === 'opened') {
                cellEl.classList.add('revealed');
                if (cellData.type === 'mine') {
                    cellEl.classList.add('mine-exploded');
                    cellEl.textContent = '💣';
                } else if (cellData.neighborMines > 0) {
                    cellEl.textContent = cellData.neighborMines;
                    cellEl.classList.add(`val-${cellData.neighborMines}`);
                }
            } else if (cellData.state === 'flagged') {
                cellEl.textContent = '🚩';
            }

            // Обробники подій
            cellEl.addEventListener('click', () => handleLeftClick(r, c));
            cellEl.addEventListener('contextmenu', (e) => handleRightClick(e, r, c));
            
            boardEl.appendChild(cellEl);
        }
    }
}

// Обробка подій
function handleLeftClick(r, c) {
    if (gameState.status !== 'process' || field[r][c].state !== 'closed') return;

    if (gameState.isFirstClick) {
        placeMines(r, c);
        gameState.isFirstClick = false;
        startTimer();
    }

    const cell = field[r][c];
    if (cell.type === 'mine') {
        cell.state = 'opened';
        endGame('lose');
    } else {
        openCellRecursive(r, c);
        checkWin();
    }
    renderBoard();
}

function handleRightClick(e, r, c) {
    e.preventDefault(); // Блокуємо стандартне меню браузера
    if (gameState.status !== 'process' || field[r][c].state === 'opened') return;

    const cell = field[r][c];
    if (cell.state === 'closed' && gameState.flagsPlaced < gameState.minesCount) {
        cell.state = 'flagged';
        gameState.flagsPlaced++;
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
        gameState.flagsPlaced--;
    }
    updateUI();
    renderBoard();
}

// Рекурсія (Логіка)
function openCellRecursive(r, c) {
    if (r < 0 || r >= gameState.rows || c < 0 || c >= gameState.cols) return;
    const cell = field[r][c];
    if (cell.state !== 'closed' || cell.type === 'mine') return;

    cell.state = 'opened';
    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                openCellRecursive(r + dr, c + dc);
            }
        }
    }
}

// Таймер та UI
function startTimer() {
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        updateUI();
    }, 1000);
}

function updateUI() {
    // Форматування чисел (001, 015 і т.д.)
    timerEl.textContent = String(gameState.gameTime).padStart(3, '0');
    flagsEl.textContent = String(gameState.minesCount - gameState.flagsPlaced).padStart(3, '0');
}

// Кінець гри
function endGame(status) {
    gameState.status = status;
    clearInterval(gameState.timerId);
    
    if (status === 'lose') {
        startBtn.textContent = '😵';
        // Відкриваємо всі міни
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                if (field[r][c].type === 'mine') field[r][c].state = 'opened';
            }
        }
    } else if (status === 'win') {
        startBtn.textContent = '😎';
    }
    renderBoard();
}

function checkWin() {
    let safeClosed = 0;
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (field[r][c].type !== 'mine' && field[r][c].state !== 'opened') {
                safeClosed++;
            }
        }
    }
    if (safeClosed === 0) endGame('win');
}

// Кнопка рестарту
startBtn.addEventListener('click', initGame);

// Запуск першої гри при завантаженні
initGame();
/* Кінець */