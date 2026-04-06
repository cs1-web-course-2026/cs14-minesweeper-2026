// --- КОНСТАНТИ (Enums та налаштування) ---
const GAME_STATUS = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const CELL_CONTENT = {
    MINE: 'mine',
    EMPTY: 'empty'
};

const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 8;
const DEFAULT_MINE_COUNT = 10;
const ALERT_DELAY_MS = 100;

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// --- ГЛОБАЛЬНИЙ СТАН ---
let gameState = {
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    minesCount: DEFAULT_MINE_COUNT,
    status: GAME_STATUS.PLAYING,
    gameTime: 0,
    timerId: null
};

let field = [];
let availableFlags = DEFAULT_MINE_COUNT;

// --- DOM ЕЛЕМЕНТИ ---
const boardEl = document.getElementById('game-board');
const flagsCounterEl = document.getElementById('flags-counter');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('reset-button');

// --- ІНІЦІАЛІЗАЦІЯ ГРИ ---
function initGame() {
    generateField(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_MINE_COUNT);
    countNeighbourMines();
    
    availableFlags = gameState.minesCount;
    updateFlagsCounter();
    
    stopTimer();
    gameState.gameTime = 0;
    updateTimerDisplay();
    
    resetBtn.textContent = '🙂';
    
    renderBoard();
    updateBoardDOM();
}

// --- ЛОГІКА ГРИ ---
function generateField(rows, cols, minesCount) {
    gameState.rows = rows;
    gameState.cols = cols;
    gameState.minesCount = minesCount;
    gameState.status = GAME_STATUS.PLAYING;
    
    field = []; 

    for (let row = 0; row < rows; row++) {
        let currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push({
                type: CELL_CONTENT.EMPTY,
                neighborMines: 0,
                state: CELL_STATE.CLOSED,
                exploded: false // Флаг для міни, на яку клікнули
            });
        }
        field.push(currentRow);
    }

    let placedMines = 0;
    if (minesCount >= rows * cols) return; 

    while (placedMines < minesCount) {
        let randomRow = Math.floor(Math.random() * rows);
        let randomCol = Math.floor(Math.random() * cols);

        if (field[randomRow][randomCol].type !== CELL_CONTENT.MINE) {
            field[randomRow][randomCol].type = CELL_CONTENT.MINE;
            placedMines++;
        }
    }
}

function countNeighbourMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].type === CELL_CONTENT.MINE) continue;

            let count = 0;
            for (let [directionalRow, directionalCol] of DIRECTIONS) {
                let neighbourRow = row + directionalRow;
                let neighbourCol = col + directionalCol;

                if (neighbourRow >= 0 && neighbourRow < gameState.rows && 
                    neighbourCol >= 0 && neighbourCol < gameState.cols) {
                    if (field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE) {
                        count++;
                    }
                }
            }
            field[row][col].neighborMines = count;
        }
    }
}

function openCell(row, col) {
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    let cell = field[row][col];

    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

    // Якщо це перший клік, запускаємо таймер
    if (gameState.gameTime === 0 && !gameState.timerId) {
        startTimer();
    }

    cell.state = CELL_STATE.OPENED;

    // Логіка програшу
    if (cell.type === CELL_CONTENT.MINE) {
        gameState.status = GAME_STATUS.LOST;
        cell.exploded = true; // Саме ця міна вибухнула
        stopTimer();
        resetBtn.textContent = '😵';
        revealAllMines();
        setTimeout(() => alert("Ви натрапили на міну! Гра закінчена."), ALERT_DELAY_MS);
        return;
    }

    // Рекурсивне відкриття порожніх клітинок
    if (cell.neighborMines === 0) {
        for (let [directionalRow, directionalCol] of DIRECTIONS) {
            let neighbourRow = row + directionalRow;
            let neighbourCol = col + directionalCol;

            if (neighbourRow >= 0 && neighbourRow < gameState.rows && 
                neighbourCol >= 0 && neighbourCol < gameState.cols) {
                if (field[neighbourRow][neighbourCol].state === CELL_STATE.CLOSED) {
                    openCell(neighbourRow, neighbourCol);
                }
            }
        }
    }

    checkWinCondition();
}

function toggleFlag(row, col) {
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    let cell = field[row][col];
    
    if (cell.state === CELL_STATE.OPENED) return;

    if (cell.state === CELL_STATE.CLOSED) {
        if (availableFlags > 0) {
            cell.state = CELL_STATE.FLAGGED;
            availableFlags--;
        }
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
        availableFlags++;
    }
    
    updateFlagsCounter();
}

function checkWinCondition() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            let cell = field[row][col];
            if (cell.type !== CELL_CONTENT.MINE && cell.state !== CELL_STATE.OPENED) {
                return; // Знайдено закриту безпечну клітинку
            }
        }
    }

    // Всі безпечні клітинки відкриті
    gameState.status = GAME_STATUS.WON;
    stopTimer();
    resetBtn.textContent = '😎';
    
    // Автоматично ставимо прапорці на всі міни, якщо гравець переміг
    availableFlags = 0;
    updateFlagsCounter();
    
    setTimeout(() => alert("Вітаємо! Ви перемогли!"), ALERT_DELAY_MS);
}

function revealAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].type === CELL_CONTENT.MINE) {
                field[row][col].state = CELL_STATE.OPENED;
            }
        }
    }
}

// --- РОБОТА З ТАЙМЕРОМ ---
function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
    
    gameState.timerId = setInterval(() => {
        if (gameState.gameTime < 999) {
            gameState.gameTime++;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

function updateTimerDisplay() {
    timerEl.textContent = gameState.gameTime.toString().padStart(3, '0');
}

function updateFlagsCounter() {
    flagsCounterEl.textContent = availableFlags.toString().padStart(3, '0');
}

// --- РОБОТА З DOM (Рендеринг та події) ---
function renderBoard() {
    boardEl.innerHTML = ''; // Очищуємо поле
    
    // Динамічно задаємо сітку
    boardEl.style.gridTemplateColumns = `repeat(${gameState.cols}, 30px)`;
    boardEl.style.gridTemplateRows = `repeat(${gameState.rows}, 30px)`;

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');
            cellEl.dataset.row = r;
            cellEl.dataset.col = c;

            // Accessibility (доступність)
            cellEl.setAttribute('role', 'button');
            cellEl.setAttribute('tabindex', '0');

            boardEl.appendChild(cellEl);
        }
    }
}

function updateBoardDOM() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellData = field[r][c];
            const cellEl = boardEl.children[r * gameState.cols + c];
            
            // Скидаємо класи та вміст
            cellEl.className = 'cell';
            cellEl.textContent = '';

            if (cellData.state === CELL_STATE.OPENED) {
                cellEl.classList.add('open');
                
                if (cellData.type === CELL_CONTENT.MINE) {
                    cellEl.textContent = '💣';
                    if (cellData.exploded) {
                        cellEl.classList.add('exploded');
                    }
                } else if (cellData.neighborMines > 0) {
                    cellEl.textContent = cellData.neighborMines;
                    cellEl.classList.add(`mine-count-${cellData.neighborMines}`);
                }
            } else if (cellData.state === CELL_STATE.FLAGGED) {
                cellEl.classList.add('mine-flagged');
                cellEl.textContent = '🚩';
            } else if (gameState.status === GAME_STATUS.WON && cellData.type === CELL_CONTENT.MINE) {
                // При перемозі візуально позначаємо всі міни прапорцями
                cellEl.classList.add('mine-flagged');
                cellEl.textContent = '🚩';
            }
        }
    }
}

// --- ОБРОБНИКИ ПОДІЙ ---
boardEl.addEventListener('click', (e) => {
    if (!e.target.classList.contains('cell')) return;
    
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);
    
    openCell(r, c);
    updateBoardDOM();
});

boardEl.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Блокуємо стандартне контекстне меню
    
    if (!e.target.classList.contains('cell')) return;
    
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);
    
    toggleFlag(r, c);
    updateBoardDOM();
});

resetBtn.addEventListener('click', () => {
    initGame();
});

// Запуск гри при завантаженні сторінки
initGame();