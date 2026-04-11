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
    availableFlags: DEFAULT_MINE_COUNT,
    status: GAME_STATUS.PLAYING,
    gameTime: 0,
    timerId: null
};

let field = [];

// --- DOM ЕЛЕМЕНТИ ---
const gameBoardElement = document.getElementById('game-board');
const flagsCounterElement = document.getElementById('flags-counter');
const timerElement = document.getElementById('timer');
const resetButton = document.getElementById('reset-button');
const gameMessageElement = document.getElementById('game-message');

// --- ІНІЦІАЛІЗАЦІЯ ГРИ ---
function initGame() {
    generateField(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_MINE_COUNT);
    countNeighbourMines();
    
    gameState.availableFlags = gameState.minesCount;
    updateFlagsCounter();
    
    stopTimer();
    gameState.gameTime = 0;
    updateTimerDisplay();
    
    resetButton.textContent = '🙂';
    gameMessageElement.textContent = ''; // Очищаємо статус-повідомлення
    
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
        resetButton.textContent = '😵';
        revealAllMines();
        setTimeout(() => { 
            gameMessageElement.textContent = "Ви натрапили на міну! Гра закінчена."; 
        }, ALERT_DELAY_MS);
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
        if (gameState.availableFlags > 0) {
            cell.state = CELL_STATE.FLAGGED;
            gameState.availableFlags--;
        }
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
        gameState.availableFlags++;
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
    resetButton.textContent = '😎';
    
    // Автоматично ставимо прапорці на всі міни, якщо гравець переміг
    gameState.availableFlags = 0;
    updateFlagsCounter();
    
    setTimeout(() => { 
        gameMessageElement.textContent = "Вітаємо! Ви перемогли!"; 
    }, ALERT_DELAY_MS);
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
    timerElement.textContent = gameState.gameTime.toString().padStart(3, '0');
}

function updateFlagsCounter() {
    flagsCounterElement.textContent = gameState.availableFlags.toString().padStart(3, '0');
}

// --- РОБОТА З DOM (Рендеринг та події) ---
function renderBoard() {
    gameBoardElement.innerHTML = ''; // Очищуємо поле
    
    // Динамічно задаємо сітку
    gameBoardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 30px)`;
    gameBoardElement.style.gridTemplateRows = `repeat(${gameState.rows}, 30px)`;

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cellButton = document.createElement('button'); // Тепер це <button>
            cellButton.type = 'button';
            cellButton.classList.add('cell');
            cellButton.dataset.row = row;
            cellButton.dataset.col = col;

            gameBoardElement.appendChild(cellButton);
        }
    }
}

function updateBoardDOM() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cellData = field[row][col];
            const cellElement = gameBoardElement.children[row * gameState.cols + col];
            
            // Скидаємо класи та вміст
            cellElement.className = 'cell';
            cellElement.textContent = '';

            if (cellData.state === CELL_STATE.OPENED) {
                cellElement.classList.add('open');
                
                let label = `Row ${row + 1}, column ${col + 1}, opened`;

                if (cellData.type === CELL_CONTENT.MINE) {
                    cellElement.textContent = '💣';
                    label = `Row ${row + 1}, column ${col + 1}, mine`;
                    if (cellData.exploded) {
                        cellElement.classList.add('exploded');
                    }
                } else if (cellData.neighborMines > 0) {
                    cellElement.textContent = cellData.neighborMines;
                    cellElement.classList.add(`mine-count-${cellData.neighborMines}`);
                    label += `, ${cellData.neighborMines} adjacent mine${cellData.neighborMines > 1 ? 's' : ''}`;
                }
                
                cellElement.setAttribute('aria-label', label);
                
            } else if (cellData.state === CELL_STATE.FLAGGED) {
                cellElement.classList.add('mine-flagged');
                cellElement.textContent = '🚩';
                cellElement.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, flagged`);
                
            } else if (gameState.status === GAME_STATUS.WON && cellData.type === CELL_CONTENT.MINE) {
                // При перемозі візуально позначаємо всі міни прапорцями
                cellElement.classList.add('mine-flagged');
                cellElement.textContent = '🚩';
                cellElement.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, flagged`);
                
            } else {
                cellElement.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, closed`);
            }
        }
    }
}

// --- ОБРОБНИКИ ПОДІЙ ---
gameBoardElement.addEventListener('click', (e) => {
    if (!e.target.classList.contains('cell')) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    openCell(row, col);
    updateBoardDOM();
});

gameBoardElement.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Блокуємо стандартне контекстне меню
    
    if (!e.target.classList.contains('cell')) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    toggleFlag(row, col);
    updateBoardDOM();
});

resetButton.addEventListener('click', () => {
    initGame();
});

// Запуск гри при завантаженні сторінки
initGame();